"use client"

import { Separator } from "@/components/ui/separator"
import {
  Share,
  Settings2,
  ArrowUp
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium text-foreground">tiny-chat</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share className="h-4 w-4" />
            <span className="sr-only">Share query</span>
          </Button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-3xl flex h-full items-center justify-center">
          <h1 className="text-4xl font-semibold text-muted-foreground/20 select-none">
            tiny-chat
          </h1>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 shrink-0">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-center bg-muted/50 rounded-2xl border px-4 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
            <input
              placeholder="Ask a follow up..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 outline-none"
            />
            <div className="flex items-center gap-2 ml-2">
              <span className="text-[10px] text-muted-foreground font-mono font-medium">tiny-chat</span>
              <Button size="icon" className="h-8 w-8 rounded-full">
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
