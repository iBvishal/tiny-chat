"use client";

import { Copy, Check } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

type CodeCopyButtonProps = {
  text: string;
};

/**
 * Reusable button for copying code blocks to clipboard
 */
export const CodeCopyButton = React.memo(function CodeCopyButton({ text }: CodeCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 border border-white/10 bg-background/10 text-white backdrop-blur-sm hover:bg-background/20"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
});
