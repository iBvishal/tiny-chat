"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { ChatError, streamChat } from "@/lib/chat-client";
import { createMessage, getThread, newId } from "@/lib/chat-tree";
import { SYSTEM_PROMPT } from "@/lib/constants";
import { isAbortError, parseError } from "@/lib/error";
import { loadChat, loadChatMeta, onChatsChanged, saveChat } from "@/lib/storage";
import type { Chat, ChatMetadata, ChatRequest, Message } from "@/lib/types";

const TEMPORARY_ID = "temp";

/**
 * First line of the first prompt, shortened for the sidebar
 */
export function titleFromPrompt(prompt: string): string {
  const line = prompt.trim().split("\n")[0];
  return line.length > 40 ? `${line.slice(0, 37)}...` : line || "New chat";
}

function emptyChat(id: string, title: string): Chat {
  return { meta: { id, title, updatedAt: Date.now() }, data: { messages: [], leafId: null } };
}

function addMessage(chat: Chat, message: Message): Chat {
  return { ...chat, data: { messages: [...chat.data.messages, message], leafId: message.id } };
}

function patchMessage(chat: Chat, id: string, patch: Partial<Message>): Chat {
  return {
    ...chat,
    data: {
      ...chat.data,
      messages: chat.data.messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    },
  };
}

function removeMessage(chat: Chat, message: Message): Chat {
  return {
    ...chat,
    data: {
      messages: chat.data.messages.filter((other) => other.id !== message.id),
      leafId: chat.data.leafId === message.id ? message.parentId : chat.data.leafId,
    },
  };
}

/**
 * Saves a chat unless it's temporary, reporting failures through `onError`
 */
async function persist(
  chat: Chat,
  metaChanges: Partial<ChatMetadata>,
  onError: (message: string) => void,
) {
  if (chat.meta.id === TEMPORARY_ID) return;
  try {
    await saveChat(chat, metaChanges);
  } catch (err) {
    onError(parseError(err));
  }
}

type UseChatOptions = {
  chatId: string | null;
  isTemporary: boolean;
  model: string;
};

/**
 * State and actions for the chat on screen
 * Saves to IndexedDB as it goes, except for temporary chats.
 */
export function useChat({ chatId, isTemporary, model }: UseChatOptions) {
  const router = useRouter();
  const [chat, setChat] = React.useState<Chat | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const activeIdRef = React.useRef<string | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);

  // Declared before the loader below so it runs first after each render.
  React.useEffect(() => {
    activeIdRef.current = chat?.meta.id ?? null;
  }, [chat]);

  // Load the chat named in the URL. A chat that was just created here is
  // already on screen, so it isn't loaded again.
  React.useEffect(() => {
    const target = isTemporary ? null : chatId;
    const isShowing = () => target !== null && target === activeIdRef.current;
    let cancelled = false;

    const load = async () => {
      if (isShowing()) return;
      const loaded = target ? await loadChat(target) : null;
      if (cancelled || isShowing()) return;
      if (target && !loaded) {
        router.replace("/");
        return;
      }
      controllerRef.current?.abort();
      setChat(loaded);
      setError(null);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [chatId, isTemporary, router]);

  // Pick up renames and pins made in the sidebar.
  React.useEffect(() => {
    const refreshMeta = async () => {
      const id = activeIdRef.current;
      if (!id || id === TEMPORARY_ID) return;
      const meta = await loadChatMeta(id);
      if (meta) setChat((prev) => (prev?.meta.id === meta.id ? { ...prev, meta } : prev));
    };
    return onChatsChanged(() => void refreshMeta());
  }, []);

  // Stop streaming if the page goes away.
  React.useEffect(() => () => controllerRef.current?.abort(), []);

  /**
   * Streams a new reply to `parent`, as a new branch if it already has one
   */
  const generate = React.useCallback(
    async (base: Chat, parent: Message) => {
      const assistant = createMessage("assistant", "", parent.id, { model });
      let current = addMessage(base, assistant);
      const controller = new AbortController();
      controllerRef.current = controller;
      setChat(current);
      setIsStreaming(true);
      setError(null);

      // Apply a change to the reply both here and on screen. Updating the
      // screen through `prev` keeps metadata that changed meanwhile.
      const apply = (change: (chat: Chat) => Chat) => {
        current = change(current);
        setChat((prev) => (prev?.meta.id === current.meta.id ? change(prev) : prev));
      };

      const request: ChatRequest = {
        model,
        system: SYSTEM_PROMPT,
        messages: getThread(base.data.messages, parent.id).map(({ role, content }) => ({
          role,
          content,
        })),
      };

      let content = "";
      let blockReason: string | null = null;
      try {
        for await (const event of streamChat(request, { signal: controller.signal })) {
          if (event.type === "text") {
            content += event.text;
            apply((draft) => patchMessage(draft, assistant.id, { content }));
          } else if (event.type === "blocked") {
            blockReason = event.reason;
          }
        }
        if (!content) {
          throw new ChatError(
            blockReason
              ? `Gemini stopped without answering (${blockReason}).`
              : "Gemini sent an empty reply. Please try again.",
          );
        }
      } catch (err) {
        const stopped = isAbortError(err);
        if (!stopped) setError(parseError(err));
        if (!content) apply((draft) => removeMessage(draft, assistant));
        else if (stopped) apply((draft) => patchMessage(draft, assistant.id, { stopped: true }));
      } finally {
        // Save before going idle, so a reload right after the reply can't lose it.
        await persist(current, { updatedAt: Date.now() }, setError);
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [model],
  );

  const send = React.useCallback(
    async (text: string) => {
      if (isStreaming || !text.trim()) return;

      const isNew = chat === null;
      let base =
        chat ??
        (isTemporary
          ? emptyChat(TEMPORARY_ID, "Temporary chat")
          : emptyChat(newId(), titleFromPrompt(text)));
      const user = createMessage("user", text, base.data.leafId);
      base = addMessage(base, user);
      setChat(base);
      // Busy from the start, so a second Enter during the save can't send twice.
      setIsStreaming(true);

      await persist(base, { updatedAt: Date.now() }, setError);
      if (isNew && !isTemporary) window.history.pushState(null, "", `/?id=${base.meta.id}`);
      await generate(base, user);
    },
    [chat, generate, isStreaming, isTemporary],
  );

  /**
   * Sends an edited copy of a user message as a new branch
   */
  const edit = React.useCallback(
    async (messageId: string, text: string) => {
      const original = chat?.data.messages.find((message) => message.id === messageId);
      if (!chat || !original || original.role !== "user" || isStreaming || !text.trim()) return;

      const user = createMessage("user", text, original.parentId);
      const base = addMessage(chat, user);
      setChat(base);
      setIsStreaming(true);
      await persist(base, { updatedAt: Date.now() }, setError);
      await generate(base, user);
    },
    [chat, generate, isStreaming],
  );

  /**
   * Asks for another reply to the message an answer replied to
   */
  const regenerate = React.useCallback(
    async (assistantId: string) => {
      const messages = chat?.data.messages ?? [];
      const answer = messages.find((message) => message.id === assistantId);
      const parent = messages.find((message) => message.id === answer?.parentId);
      if (!chat || !parent || isStreaming) return;
      await generate(chat, parent);
    },
    [chat, generate, isStreaming],
  );

  /**
   * Replies to the last message after a failed attempt
   */
  /**
   * Stops the reply in progress, keeping what has arrived so far
   */
  const stop = React.useCallback(() => controllerRef.current?.abort(), []);

  const retry = React.useCallback(async () => {
    const leaf = chat?.data.messages.find((message) => message.id === chat.data.leafId);
    if (!chat || !leaf || leaf.role !== "user" || isStreaming) return;
    await generate(chat, leaf);
  }, [chat, generate, isStreaming]);

  const data = chat?.data;
  const thread = React.useMemo(() => (data ? getThread(data.messages, data.leafId) : []), [data]);

  return { chat, thread, isStreaming, error, send, edit, regenerate, retry, stop };
}
