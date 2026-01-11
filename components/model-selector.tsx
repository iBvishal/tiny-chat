"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/gemini"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function ModelSelector({
    selectedModel,
    onModelChange
}: {
    selectedModel: string
    onModelChange: (model: string) => void
}) {
    const [isOpen, setIsOpen] = React.useState(false)
    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

    return (
        <div className="relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs font-medium hover:bg-muted flex items-center gap-1"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span className="hidden sm:inline">{currentModel.name}</span>
                        <span className="sm:hidden">{currentModel.name.split(' ')[0]}</span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Select AI Model</TooltipContent>
            </Tooltip>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsOpen(false)
                        }}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[240px] rounded-lg border bg-popover p-1 shadow-lg">
                        {AVAILABLE_MODELS.map((model) => (
                            <button
                                key={model.id}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                                onClick={() => {
                                    onModelChange(model.id)
                                    setIsOpen(false)
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{model.name}</span>
                                    <span className="text-xs text-muted-foreground">{model.category}</span>
                                </div>
                                {selectedModel === model.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
