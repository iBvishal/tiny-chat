"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Share, ArrowUp, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { streamGeminiResponse } from "@/lib/gemini"
import { getChats, saveChat, generateId, ChatSession, Message } from "@/lib/storage"
import { useSearchParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("id")

  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const [session, setSession] = React.useState<ChatSession | null>(null)

  React.useEffect(() => {
    if (chatId) {
      const chats = getChats()
      const existingChat = chats.find(c => c.id === chatId)
      if (existingChat) {
        setMessages(existingChat.messages)
        setSession(existingChat)
      } else {
        router.push("/")
      }
    } else {
      setMessages([])
      setSession(null)
    }
  }, [chatId, router])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    const currentId = chatId || generateId()
    const firstPrompt = messages.length === 0 ? input : (session?.title || "New Chat")

    const assistantPlaceholder: Message = { role: "assistant", content: "" }
    const updatedMessages = [...newMessages, assistantPlaceholder]
    setMessages(updatedMessages)

    try {
      let fullResponse = ""
      await streamGeminiResponse(input, messages, (chunk) => {
        fullResponse += chunk
        setMessages((prev) => {
          const streamMessages = [...prev]
          streamMessages[streamMessages.length - 1] = {
            role: "assistant",
            content: fullResponse
          }
          return streamMessages
        })
      })

      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: fullResponse }]
      const updatedSession: ChatSession = {
        id: currentId,
        title: firstPrompt.length > 40 ? firstPrompt.substring(0, 37) + "..." : firstPrompt,
        messages: finalMessages,
        updatedAt: Date.now()
      }

      saveChat(updatedSession)
      setSession(updatedSession)

      if (!chatId) {
        window.history.pushState(null, "", `/?id=${currentId}`)
      }
    } catch (error) {
      console.error("Failed to get response:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please check your API key." } as Message
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium text-foreground truncate shrink-0">tiny-chat</span>
          {session && (
            <>
              <span className="text-muted-foreground/40 shrink-0">/</span>
              <span className="truncate text-xs text-muted-foreground font-normal">{session.title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 transition-colors hover:bg-muted">
                <Share className="h-4 w-4" />
                <span className="sr-only">Share query</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Share</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 scroll-smooth" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-4xl font-semibold text-muted-foreground/10 select-none">
                tiny-chat
              </h1>
            </div>
          ) : (
            <div className="space-y-6 pb-4 flex-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[100%] rounded-2xl px-4 py-2.5 text-sm break-words overflow-hidden ${msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none ml-12"
                        : "bg-muted/50 text-foreground rounded-tl-none border mr-12"
                      }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <div className="relative group/code">
                                <div className="absolute right-3 top-3 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                  <CodeCopyButton text={String(children).replace(/\n$/, '')} />
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="!my-0 !bg-transparent"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code {...props} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1].content === "" && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground/60">THINKING</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 shrink-0">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-muted/30 rounded-2xl border px-4 py-2 transition-all focus-within:bg-muted/50"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask tiny..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 outline-none disabled:opacity-50"
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
      </div>
    </div>
  )
}

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      className="h-8 w-8 bg-background/10 hover:bg-background/20 backdrop-blur-sm text-white border-white/10 border"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}
