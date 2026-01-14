"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, Loader2, Download, AlertCircle, MessageSquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { streamGeminiResponse } from "@/lib/gemini";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModelSelector } from "@/components/model-selector";
import { getChatHistory, getChatMessages, saveChat, generateId } from "@/lib/storage";
import type { Message, ChatMetadata, ChatSession } from "@/lib/types";
import { parseError } from "@/lib/error";
import {
  MIN_ANIMATION_DURATION,
  MAX_TEXTAREA_HEIGHT,
  DEFAULT_MODEL
} from "@/lib/constants";
import { useSearchParams, useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TypewriterTitle } from "@/components/typewriter/typewriter-title";
import { AssistantMessage } from "@/components/chat/assistant-message";
import { UserMessage } from "@/components/chat/user-message";

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
      const metadata = history.find(c => c.id === chatId);
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

  const handleSubmit = async (e?: React.FormEvent, overridePrompt?: string, overrideHistory?: Message[], overrideBaseMessages?: Message[]) => {
    e?.preventDefault();
    const promptValue = overridePrompt || input;
    if (!promptValue.trim() || isLoading) return;

    // Check for API key
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("Gemini API key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.");
      return;
    }

    const historyMessages = overrideHistory || messages;
    let baseMsgs: Message[];

    if (overrideBaseMessages) {
      baseMsgs = overrideBaseMessages;
    } else if (editingMessageIndex !== null) {
      // Editing mode: replace the message at editingMessageIndex and remove everything after
      baseMsgs = [...messages.slice(0, editingMessageIndex), { role: "user", content: promptValue }];
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

    const currentId = isTemporary ? "temp" : (chatId || generateId());
    const firstPrompt = messages.length === 0 ? promptValue : (sessionMetadata?.title || "New Chat");

    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    const updatedMessages = [...baseMsgs, assistantPlaceholder];
    setMessages(updatedMessages);

    // Track when the animation started
    const animationStartTime = Date.now();

    try {
      let fullResponse = "";
      await streamGeminiResponse(promptValue, historyMessages, (chunk) => {
        fullResponse += chunk;
        // Don't update messages during the minimum animation period
        const elapsed = Date.now() - animationStartTime;
        if (elapsed >= MIN_ANIMATION_DURATION) {
          setMessages((prev) => {
            const streamMessages = [...prev];
            streamMessages[streamMessages.length - 1] = {
              role: "assistant",
              content: fullResponse
            };
            return streamMessages;
          });
        }
      }, selectedModel);

      // Ensure minimum animation time has passed
      const elapsed = Date.now() - animationStartTime;
      if (elapsed < MIN_ANIMATION_DURATION) {
        await new Promise(resolve => setTimeout(resolve, MIN_ANIMATION_DURATION - elapsed));
      }

      // Now show the full response
      setMessages((prev) => {
        const streamMessages = [...prev];
        streamMessages[streamMessages.length - 1] = {
          role: "assistant",
          content: fullResponse
        };
        return streamMessages;
      });

      if (!isTemporary) {
        const finalMessages: Message[] = [...baseMsgs, { role: "assistant", content: fullResponse }];
        const updatedSession: ChatSession = {
          id: currentId,
          title: firstPrompt.length > 40 ? firstPrompt.substring(0, 37) + "..." : firstPrompt,
          messages: finalMessages,
          updatedAt: Date.now()
        };

        saveChat(updatedSession.id, updatedSession.title, finalMessages);
        setSessionMetadata({ id: updatedSession.id, title: updatedSession.title, updatedAt: updatedSession.updatedAt });

        if (!chatId) {
          window.history.pushState(null, "", `/?id=${currentId}`);
        }
      }
    } catch (err: unknown) {
      setError(parseError(err));
      // Remove the empty assistant placeholder on error
      setMessages((prev) => prev.filter(m => m.content !== ""));
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
    handleSubmit(undefined, prompt, historyBeforeUser, baseMessagesWithUser);
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
      .map(msg => `${msg.role.toUpperCase()}:\n${msg.content}\n\n---\n\n`)
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
        <div className="flex flex-col h-screen bg-background max-w-full overflow-x-hidden flex-1">
          {/* Header */}
          <header className="relative flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="font-medium text-foreground truncate shrink-0">tiny-chat</span>
              {sessionMetadata && (
                <>
                  <span className="text-muted-foreground/40 shrink-0">/</span>
                  <span className="truncate text-xs text-muted-foreground font-normal">{sessionMetadata.title}</span>

                </>
              )}
            </div>

            {/* Center - Model Selector */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-4">
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
                    className={`h-8 w-8 transition-colors hover:bg-muted ${isTemporary ? "text-amber-600 dark:text-amber-400 bg-amber-400/10 hover:bg-amber-400/20" : ""}`}
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
          </header >

          {/* Content Area */}
          < div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-12 scroll-smooth" ref={scrollRef} >
            <div className="mx-auto max-w-3xl space-y-6 min-h-full flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <TypewriterTitle />
                </div>
              ) : (
                <div className="space-y-6 pb-4 flex-1">
                  {messages.map((msg, i) => {
                    if (msg.role === "assistant" && !msg.content) return null;
                    return (
                      <div
                        key={i}
                        className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
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
          </div >

          {/* Input Area */}
          < div className="p-4 md:p-8 shrink-0" >
            <div className="mx-auto max-w-3xl">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold mb-0.5 text-destructive/90">Error</p>
                    <p className="opacity-80 leading-relaxed break-words">{error}</p>
                  </div>
                </div>
              )}
              <form
                onSubmit={handleSubmit}
                className="relative flex items-end bg-muted/30 rounded-2xl border px-4 py-3 transition-all focus-within:bg-muted/50"
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
                  }}
                  placeholder="Ask tiny..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 outline-none disabled:opacity-50 resize-none max-h-[72px]"
                  style={{ minHeight: "24px", maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
                />
                <div className="flex items-center gap-2 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-9 w-9 rounded-full transition-all hover:scale-105 active:scale-95 disabled:grayscale"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                        <span className="sr-only">Send message</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Send message</TooltipContent>
                  </Tooltip>
                </div>
              </form>
            </div>
          </div >
        </div >
      </div>
    </SidebarProvider>
  );
}