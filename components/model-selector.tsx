import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { AVAILABLE_MODELS } from "@/lib/gemini"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-medium hover:bg-muted flex items-center gap-1"
                        >
                            <span className="hidden sm:inline">{currentModel.name}</span>
                            <span className="sm:hidden">{currentModel.name.split(' ')[0]}</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Select AI Model</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-[240px]">
                {AVAILABLE_MODELS.map((model) => (
                    <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer"
                    >
                        <div className="flex flex-col">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.category}</span>
                        </div>
                        {selectedModel === model.id && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
