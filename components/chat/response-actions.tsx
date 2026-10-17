"use client";

import { Copy, Check, RotateCw, Volume2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { markdownToSpeech } from "@/lib/speech";

type ResponseActionsProps = {
  content: string;
  onRedo: () => void;
};

/**
 * Action buttons for AI responses (copy, redo, etc.)
 */
export const ResponseActions = React.memo(function ResponseActions({
  content,
  onRedo,
}: ResponseActionsProps) {
  const [copied, setCopied] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // Stop reading if the message leaves the screen, for example on a chat switch.
  React.useEffect(
    () => () => {
      if (utteranceRef.current) window.speechSynthesis.cancel();
    },
    [],
  );

  const handleCopy = () => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleListen = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancelling also ends any other message being read, which resets its button.
    window.speechSynthesis.cancel();
    if (speaking) return;

    const utterance = new SpeechSynthesisUtterance(markdownToSpeech(content));
    const done = () => {
      if (utteranceRef.current === utterance) utteranceRef.current = null;
      setSpeaking(false);
    };
    utterance.addEventListener("end", done);
    utterance.addEventListener("error", done);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div className="mt-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-lg transition-colors ${speaking ? "bg-muted text-foreground" : "text-muted-foreground/70 hover:bg-muted hover:text-foreground"}`}
            onClick={handleToggleListen}
            aria-label={speaking ? "Stop reading" : "Read aloud"}
          >
            <Volume2 className={`h-3.5 w-3.5 ${speaking ? "animate-pulse" : ""}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="px-2 py-1 text-[10px]">
          {speaking ? "Stop" : "Listen"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground/70 hover:bg-muted hover:text-foreground"
            onClick={handleCopy}
            aria-label="Copy response"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="px-2 py-1 text-[10px]">
          {copied ? "Copied" : "Copy"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground/70 hover:bg-muted hover:text-foreground"
            onClick={onRedo}
            aria-label="Redo AI response"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="px-2 py-1 text-[10px]">
          Redo
        </TooltipContent>
      </Tooltip>
    </div>
  );
});
