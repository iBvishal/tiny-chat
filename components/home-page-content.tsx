"use client";

import { ArrowUp, Download, AlertCircle, MessageSquareDashed, Square, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { ModelSelector } from "@/components/model-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/use-chat";
import { MAX_TEXTAREA_HEIGHT, DEFAULT_MODEL } from "@/lib/constants";
import { downloadChat } from "@/lib/download";

function handleListen(text: string, isCurrentlySpeaking: boolean): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  if (isCurrentlySpeaking) {
    window.speechSynthesis.cancel();
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
  return true;
}

export default function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");
  const isTemporary = searchParams.get("temp") === "true";

  const [input, setInput] = React.useState("");
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>(DEFAULT_MODEL);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { chat, thread, isStreaming, error, send, edit, regenerate, retry, stop } = useChat({
    chatId,
    isTemporary,
    model: selectedModel,
  });
  const lastMessage = thread.at(-1);

  const resetInput = () => {
    setInput("");
    setEditingMessageId(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    if (editingMessageId) {
      void edit(editingMessageId, input);
    } else {
      void send(input);
    }
    resetInput();
  };

  const handleEdit = React.useCallback((id: string, text: string) => {
    setInput(text);
    setEditingMessageId(id);
    textareaRef.current?.focus();
  }, []);

  const handleRedo = React.useCallback((id: string) => void regenerate(id), [regenerate]);

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
              {chat && (
                <>
                  <span className="shrink-0 text-muted-foreground/40">/</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {chat.meta.title}
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
              {thread.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 transition-colors hover:bg-muted"
                      onClick={() => downloadChat(chat?.meta.title ?? "", thread)}
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

          <MessageList
            thread={thread}
            isStreaming={isStreaming}
            onEdit={handleEdit}
            onRedo={handleRedo}
            onListen={handleListen}
          />

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
                  {lastMessage?.role === "user" && !isStreaming && (
                    <button
                      type="button"
                      onClick={() => void retry()}
                      className="shrink-0 rounded-md px-2 py-1 font-medium hover:bg-destructive/10"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              {editingMessageId && (
                <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <span>Editing a message. Sending starts a new branch from here.</span>
                  <button
                    type="button"
                    onClick={resetInput}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
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
                      handleSubmit();
                    }
                    if (e.key === "Escape") {
                      if (isStreaming) stop();
                      else if (editingMessageId) resetInput();
                    }
                  }}
                  placeholder="Ask tiny..."
                  rows={1}
                  className="max-h-[72px] flex-1 resize-none border-none bg-transparent py-1 text-sm outline-none focus:ring-0"
                  style={{ minHeight: "24px", maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
                />
                <div className="ml-2 flex items-center gap-2">
                  {isStreaming ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={stop}
                          size="icon"
                          aria-label="Stop generating"
                          className="h-9 w-9 rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                          <Square className="h-3.5 w-3.5 fill-current" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Stop (Esc)</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          disabled={!input.trim()}
                          size="icon"
                          aria-label="Send message"
                          className="h-9 w-9 rounded-full transition-all hover:scale-105 active:scale-95 disabled:grayscale"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Send message</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
