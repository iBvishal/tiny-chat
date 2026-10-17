"use client";

import { ArrowDown } from "lucide-react";
import * as React from "react";

import { TypewriterTitle } from "@/components/typewriter/typewriter-title";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import type { Message } from "@/lib/types";

import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

type MessageListProps = {
  thread: readonly Message[];
  isStreaming: boolean;
  onEdit: (id: string, text: string) => void;
  onRedo: (id: string) => void;
  onListen: (text: string, speaking: boolean) => boolean;
};

/**
 * The branch on screen. Follows new text while you're at the bottom, and
 * leaves you where you are if you scroll up to read.
 */
export function MessageList({ thread, isStreaming, onEdit, onRedo, onListen }: MessageListProps) {
  const { ref, isAtBottom, scrollToBottom, scrollProps } = useStickToBottom<HTMLDivElement>();
  const lastMessage = thread.at(-1);
  const lastUserMessageId = thread.findLast((message) => message.role === "user")?.id;

  // A new question, or another chat, starts at the bottom again.
  React.useEffect(() => {
    if (lastUserMessageId) scrollToBottom();
  }, [lastUserMessageId, scrollToBottom]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        {...scrollProps}
        className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 lg:p-12"
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col space-y-6">
          {thread.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <TypewriterTitle />
            </div>
          ) : (
            <div className="flex-1 space-y-6 pb-4">
              {thread.map((message) => {
                const isLoading = isStreaming && message.id === lastMessage?.id;
                if (message.role === "assistant" && !message.content && !isLoading) return null;
                return (
                  <div
                    key={message.id}
                    className={`group flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {message.role === "user" ? (
                      <UserMessage id={message.id} content={message.content} onEdit={onEdit} />
                    ) : (
                      <AssistantMessage
                        id={message.id}
                        content={message.content}
                        isLoading={isLoading}
                        stopped={message.stopped}
                        onListen={onListen}
                        onRedo={onRedo}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!isAtBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Jump to latest"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 animate-in rounded-full border bg-background p-2 text-muted-foreground shadow-md transition-colors fade-in hover:text-foreground"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
