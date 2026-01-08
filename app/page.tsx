"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Share,
  Settings2,
  ArrowUp,
  FileText,
  Clock
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">tiny-chat</h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono">
                <FileText className="h-3 w-3" /> Used 2 sources
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="h-3 w-3" /> Completed in 1.2s
              </span>
            </div>
          </div>

          <div className="max-w-none space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers.
            </p>

            <div>
              <h3 className="text-lg font-semibold mt-6 mb-2">1. The Qubit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unlike classical bits, which can be either 0 or 1, quantum bits (qubits) can exist in a state of superposition, representing both 0 and 1 simultaneously. This allows quantum computers to process a vast amount of possibilities at once.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mt-6 mb-2">2. Entanglement</h3>
              <p className="text-muted-foreground leading-relaxed">
                This is a phenomenon where qubits become interconnected such that the state of one qubit instantly influences the state of another, no matter the distance between them.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 shrink-0">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-center bg-muted/50 rounded-2xl border px-4 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
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
