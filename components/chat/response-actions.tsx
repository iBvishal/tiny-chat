"use client";

import * as React from "react";
import { Copy, Check, RotateCw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ResponseActionsProps = {
    content: string;
    onListen: (text: string, speaking: boolean) => boolean;
    onRedo: () => void;
};

/**
 * Action buttons for AI responses (copy, redo, etc.)
 */
export const ResponseActions = React.memo(function ResponseActions({
    content,
    onListen,
    onRedo
}: ResponseActionsProps) {
    const [copied, setCopied] = React.useState(false);
    const [speaking, setSpeaking] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleListen = () => {
        const isNowSpeaking = onListen(content, speaking);
        setSpeaking(isNowSpeaking);

        // Reset speaking state when synthetic speech ends
        if (isNowSpeaking) {
            const checkSpeaking = setInterval(() => {
                if (typeof window !== "undefined" && !window.speechSynthesis.speaking) {
                    setSpeaking(false);
                    clearInterval(checkSpeaking);
                }
            }, 500);
        }
    };

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
                <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
                    {speaking ? "Stop" : "Listen"}
                </TooltipContent>
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
                <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
                    {copied ? "Copied" : "Copy"}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted rounded-lg"
                        onClick={onRedo}
                        aria-label="Redo AI response"
                    >
                        <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
                    Redo
                </TooltipContent>
            </Tooltip>
        </div>
    );
});
