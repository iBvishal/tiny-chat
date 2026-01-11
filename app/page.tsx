"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { ArrowUp, Loader2, Copy, Check, AlertCircle, RotateCw, Volume2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { streamGeminiResponse } from "@/lib/gemini"
import { getChatHistory, getChatMessages, saveChat, generateId, ChatSession, Message, ChatMetadata } from "@/lib/storage"
import { useSearchParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("id")
  const isTemporary = searchParams.get("temp") === "true"

  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const [sessionMetadata, setSessionMetadata] = React.useState<ChatMetadata | null>(null)

  // Load chat on mount or ID change
  React.useEffect(() => {
    setError(null)
    if (isTemporary) {
      setMessages([])
      setSessionMetadata({ id: "temp", title: "Temporary Chat", updatedAt: Date.now() })
    } else if (chatId) {
      const history = getChatHistory()
      const metadata = history.find(c => c.id === chatId)
      if (metadata) {
        const fullMessages = getChatMessages(chatId)
        setMessages(fullMessages)
        setSessionMetadata(metadata)
      } else {
        router.push("/")
      }
    } else {
      setMessages([])
      setSessionMetadata(null)
    }
  }, [chatId, isTemporary, router])

  // Auto-scroll to bottom of chat
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e?: React.FormEvent, overridePrompt?: string, overrideHistory?: Message[], overrideBaseMessages?: Message[]) => {
    e?.preventDefault()
    const promptValue = overridePrompt || input
    if (!promptValue.trim() || isLoading) return

    // Check for API key
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("Gemini API key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.")
      return
    }

    const historyMessages = overrideHistory || messages
    let baseMsgs: Message[]

    if (overrideBaseMessages) {
      baseMsgs = overrideBaseMessages
    } else {
      baseMsgs = [...messages, { role: "user", content: promptValue }]
      setInput("")
    }

    setIsLoading(true)
    setError(null)

    const currentId = isTemporary ? "temp" : (chatId || generateId())
    const firstPrompt = messages.length === 0 ? promptValue : (sessionMetadata?.title || "New Chat")

    const assistantPlaceholder: Message = { role: "assistant", content: "" }
    const updatedMessages = [...baseMsgs, assistantPlaceholder]
    setMessages(updatedMessages)

    try {
      let fullResponse = ""
      await streamGeminiResponse(promptValue, historyMessages, (chunk) => {
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

      if (!isTemporary) {
        const finalMessages: Message[] = [...baseMsgs, { role: "assistant", content: fullResponse }]
        const updatedSession: ChatSession = {
          id: currentId,
          title: firstPrompt.length > 40 ? firstPrompt.substring(0, 37) + "..." : firstPrompt,
          messages: finalMessages,
          updatedAt: Date.now()
        }

        saveChat(updatedSession)
        setSessionMetadata({ id: updatedSession.id, title: updatedSession.title, updatedAt: updatedSession.updatedAt })

        if (!chatId) {
          window.history.pushState(null, "", `/?id=${currentId}`)
        }
      }
    } catch (err: any) {
      console.error("Failed to get response:", err)
      setError(err?.message || "Sorry, I encountered an error. Please check your API key.")
      // Remove the empty assistant placeholder on error
      setMessages((prev) => prev.filter(m => m.content !== ""))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedo = () => {
    if (messages.length < 2 || isLoading) return

    // Find last user message
    let lastUserMessageIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i
        break
      }
    }

    if (lastUserMessageIndex === -1) return

    const prompt = messages[lastUserMessageIndex].content
    // The history should include everything UP TO AND INCLUDING the user message we are re-processing
    const historyBeforeUser = messages.slice(0, lastUserMessageIndex)
    const baseMessagesWithUser = messages.slice(0, lastUserMessageIndex + 1)

    // We already have the user message in the state, just trigger Gemini for it
    handleSubmit(undefined, prompt, historyBeforeUser, baseMessagesWithUser)
  }

  const handleListen = (text: string, isCurrentlySpeaking: boolean): boolean => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false

    if (isCurrentlySpeaking) {
      window.speechSynthesis.cancel()
      return false
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
    return true
  }

  const handleDownload = () => {
    if (messages.length === 0) return

    const chatContent = messages
      .map(msg => `${msg.role.toUpperCase()}:\n${msg.content}\n\n---\n\n`)
      .join("")

    const blob = new Blob([chatContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    a.download = `tiny-chat-${sessionMetadata?.title || "export"}-${timestamp}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-screen bg-background max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium text-foreground truncate shrink-0">tiny-chat</span>
          {sessionMetadata && (
            <>
              <span className="text-muted-foreground/40 shrink-0">/</span>
              <span className="truncate text-xs text-muted-foreground font-normal">{sessionMetadata.title}</span>
              {isTemporary && (
                <div className="ml-2 px-1.5 py-0.5 bg-amber-400/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-tighter rounded border border-amber-400/20 shrink-0">
                  Temporary
                </div>
              )}
            </>
          )}
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
              {messages.map((msg, i) => {
                if (msg.role === "assistant" && !msg.content) return null;
                return (
                  <div
                    key={i}
                    className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[100%] text-sm break-words overflow-hidden ${msg.role === "user"
                        ? "bg-muted/80 text-foreground rounded-2xl rounded-tr-none px-4 pt-3 pb-2 ml-12"
                        : "text-foreground mr-12 pt-1" // No background or border for assistant
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

                      {msg.role === "assistant" && msg.content && !isLoading && (
                        <ResponseActions
                          content={msg.content}
                          onListen={(text, speaking) => handleListen(text, speaking)}
                          onRedo={handleRedo}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && messages[messages.length - 1]?.content === "" && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-1 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground/50 uppercase">Thinking</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 shrink-0">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-0.5 text-destructive/90">Authentication Error</p>
                <p className="opacity-80 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
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

function ResponseActions({ content, onListen, onRedo }: { content: string, onListen: (text: string, speaking: boolean) => boolean, onRedo: () => void }) {
  const [copied, setCopied] = React.useState(false)
  const [speaking, setSpeaking] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleListen = () => {
    const isNowSpeaking = onListen(content, speaking)
    setSpeaking(isNowSpeaking)

    // Reset speaking state when synthetic speech ends
    if (isNowSpeaking) {
      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setSpeaking(false)
          clearInterval(checkSpeaking)
        }
      }, 500)
    }
  }

  return (
    <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-lg transition-colors ${speaking ? "bg-muted text-foreground" : "text-muted-foreground/70 hover:text-foreground hover:bg-muted"}`}
            onClick={handleToggleListen}
          >
            <Volume2 className={`h-3.5 w-3.5 ${speaking ? "animate-pulse" : ""}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1">{speaking ? "Stop" : "Listen"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted rounded-lg"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1">{copied ? "Copied" : "Copy"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted rounded-lg"
            onClick={onRedo}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1">Redo</TooltipContent>
      </Tooltip>
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
