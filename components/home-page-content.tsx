"use client";

import { ArrowUp, Loader2, Download, AlertCircle, MessageSquareDashed } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AssistantMessage } from "@/components/chat/assistant-message";
import { UserMessage } from "@/components/chat/user-message";
import { ModelSelector } from "@/components/model-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { TypewriterTitle } from "@/components/typewriter/typewriter-title";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { streamChat } from "@/lib/chat-client";
import {
  MIN_ANIMATION_DURATION,
  MAX_TEXTAREA_HEIGHT,
  DEFAULT_MODEL,
  SYSTEM_PROMPT,
} from "@/lib/constants";
import { parseError } from "@/lib/error";
import { getChatHistory, getChatMessages, saveChat, generateId } from "@/lib/storage";
import type { Message, ChatMetadata, ChatRequest, ChatSession } from "@/lib/types";

export default function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");
  const isTemporary = searchParams.get("temp") === "true";

  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = React.useState<number | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>(DEFAULT_MODEL);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [sessionMetadata, setSessionMetadata] = React.useState<ChatMetadata | null>(null);

  // Load chat on mount or ID change
  React.useEffect(() => {
    setError(null);
    if (isTemporary) {
      setMessages([]);
      setSessionMetadata({ id: "temp", title: "Temporary Chat", updatedAt: Date.now() });
    } else if (chatId) {
      const history = getChatHistory();
      const metadata = history.find((c) => c.id === chatId);
      if (metadata) {
        const fullMessages = getChatMessages(chatId);
        setMessages(fullMessages);
        setSessionMetadata(metadata);
      } else {
        router.push("/");
      }
    } else {
      setMessages([]);
      setSessionMetadata(null);
    }
  }, [chatId, isTemporary, router]);

  // Auto-scroll to bottom of chat
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (
    e?: React.FormEvent,
    overridePrompt?: string,
    overrideHistory?: Message[],
    overrideBaseMessages?: Message[],
  ) => {
    e?.preventDefault();
    const promptValue = overridePrompt || input;
    if (!promptValue.trim() || isLoading) return;

    const historyMessages = overrideHistory || messages;
    let baseMsgs: Message[];

    if (overrideBaseMessages) {
      baseMsgs = overrideBaseMessages;
    } else if (editingMessageIndex !== null) {
      // Editing mode: replace the message at editingMessageIndex and remove everything after
      baseMsgs = [
        ...messages.slice(0, editingMessageIndex),
        { role: "user", content: promptValue },
      ];
      setEditingMessageIndex(null);
    } else {
      baseMsgs = [...messages, { role: "user", content: promptValue }];
    }

    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsLoading(true);
    setError(null);

    const currentId = isTemporary ? "temp" : chatId || generateId();
    const firstPrompt = messages.length === 0 ? promptValue : sessionMetadata?.title || "New Chat";

    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    const updatedMessages = [...baseMsgs, assistantPlaceholder];
    setMessages(updatedMessages);

    // Track when the animation started
    const animationStartTime = Date.now();

    try {
      let fullResponse = "";
      const request: ChatRequest = {
        model: selectedModel,
        system: SYSTEM_PROMPT,
        messages: [...historyMessages, { role: "user", content: promptValue }],
      };
      for await (const event of streamChat(request, {})) {
        if (event.type !== "text") continue;
        fullResponse += event.text;
        // Don't update messages during the minimum animation period
        const elapsed = Date.now() - animationStartTime;
        if (elapsed >= MIN_ANIMATION_DURATION) {
          setMessages((prev) => {
            const streamMessages = [...prev];
            streamMessages[streamMessages.length - 1] = {
              role: "assistant",
              content: fullResponse,
            };
            return streamMessages;
          });
        }
      }

      // Ensure minimum animation time has passed
      const elapsed = Date.now() - animationStartTime;
      if (elapsed < MIN_ANIMATION_DURATION) {
        await new Promise((resolve) => setTimeout(resolve, MIN_ANIMATION_DURATION - elapsed));
      }

      // Now show the full response
      setMessages((prev) => {
        const streamMessages = [...prev];
        streamMessages[streamMessages.length - 1] = {
          role: "assistant",
          content: fullResponse,
        };
        return streamMessages;
      });

      if (!isTemporary) {
        const finalMessages: Message[] = [
          ...baseMsgs,
          { role: "assistant", content: fullResponse },
        ];
        const updatedSession: ChatSession = {
          id: currentId,
          title: firstPrompt.length > 40 ? firstPrompt.substring(0, 37) + "..." : firstPrompt,
          messages: finalMessages,
          updatedAt: Date.now(),
        };

        saveChat(updatedSession.id, updatedSession.title, finalMessages);
        setSessionMetadata({
          id: updatedSession.id,
          title: updatedSession.title,
          updatedAt: updatedSession.updatedAt,
        });

        if (!chatId) {
          window.history.pushState(null, "", `/?id=${currentId}`);
        }
      }
    } catch (err: unknown) {
      setError(parseError(err));
      // Remove the empty assistant placeholder on error
      setMessages((prev) => prev.filter((m) => m.content !== ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedo = () => {
    if (messages.length < 2 || isLoading) return;

    // Find last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    const prompt = messages[lastUserMessageIndex].content;
    // The history should include everything UP TO AND INCLUDING the user message we are re-processing
    const historyBeforeUser = messages.slice(0, lastUserMessageIndex);
    const baseMessagesWithUser = messages.slice(0, lastUserMessageIndex + 1);

    // We already have the user message in the state, just trigger Gemini for it
    // Explicitly set messages to remove the old response first
    setMessages(baseMessagesWithUser);
    void handleSubmit(undefined, prompt, historyBeforeUser, baseMessagesWithUser);
  };

  const handleListen = (text: string, isCurrentlySpeaking: boolean): boolean => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;

    if (isCurrentlySpeaking) {
      window.speechSynthesis.cancel();
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const handleDownload = () => {
    if (messages.length === 0) return;

    const chatContent = messages
      .map((msg) => `${msg.role.toUpperCase()}:\n${msg.content}\n\n---\n\n`)
      .join("");

    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    a.download = `tiny-chat-${sessionMetadata?.title || "export"}-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="flex flex-1">
        <AppSidebar />
        <div className="flex h-screen max-w-full flex-1 flex-col overflow-x-hidden bg-background">
          {/* Header */}
          <header className="relative flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2 overflow-hidden text-sm text-muted-foreground">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
              <span className="shrink-0 truncate font-medium text-foreground">tiny-chat</span>
              {sessionMetadata && (
                <>
                  <span className="shrink-0 text-muted-foreground/40">/</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {sessionMetadata.title}
                  </span>
                </>
              )}
            </div>

            {/* Center - Model Selector */}
            <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 md:flex">
              <ThemeToggle />
              <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 transition-colors hover:bg-muted"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download chat</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Download</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-colors hover:bg-muted ${isTemporary ? "bg-amber-400/10 text-amber-600 hover:bg-amber-400/20 dark:text-amber-400" : ""}`}
                    onClick={() => {
                      if (isTemporary) {
                        router.push("/");
                      } else {
                        router.push("/?temp=true");
                      }
                    }}
                  >
                    <MessageSquareDashed className="h-4 w-4" />
                    <span className="sr-only">Toggle temporary chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Temporary chat</TooltipContent>
              </Tooltip>

              <div className="md:hidden">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div
            className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth p-4 md:p-8 lg:p-12"
            ref={scrollRef}
          >
            <div className="mx-auto flex min-h-full max-w-3xl flex-col space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <TypewriterTitle />
                </div>
              ) : (
                <div className="flex-1 space-y-6 pb-4">
                  {messages.map((msg, i) => {
                    if (msg.role === "assistant" && !msg.content) return null;
                    return (
                      <div
                        key={i}
                        className={`group flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        {msg.role === "user" ? (
                          <UserMessage
                            content={msg.content}
                            onEdit={(text) => {
                              setInput(text);
                              setEditingMessageIndex(i);
                            }}
                          />
                        ) : (
                          <AssistantMessage
                            content={msg.content}
                            isLoading={isLoading && i === messages.length - 1}
                            isLast={i === messages.length - 1}
                            onListen={handleListen}
                            onRedo={handleRedo}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-4 md:p-8">
            <div className="mx-auto max-w-3xl">
              {error && (
                <div className="mb-4 flex animate-in items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive fade-in slide-in-from-bottom-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 font-semibold text-destructive/90">Error</p>
                    <p className="leading-relaxed break-words opacity-80">{error}</p>
                  </div>
                </div>
              )}
              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="relative flex items-end rounded-2xl border bg-muted/30 px-4 py-3 transition-all focus-within:bg-muted/50"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  placeholder="Ask tiny..."
                  disabled={isLoading}
                  rows={1}
                  className="max-h-[72px] flex-1 resize-none border-none bg-transparent py-1 text-sm outline-none focus:ring-0 disabled:opacity-50"
                  style={{ minHeight: "24px", maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
                />
                <div className="ml-2 flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-9 w-9 rounded-full transition-all hover:scale-105 active:scale-95 disabled:grayscale"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                        <span className="sr-only">Send message</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Send message</TooltipContent>
                  </Tooltip>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
