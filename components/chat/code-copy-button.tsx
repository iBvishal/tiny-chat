"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

type CodeCopyButtonProps = {
    text: string;
};

/**
 * Reusable button for copying code blocks to clipboard
 */
export const CodeCopyButton = React.memo(function CodeCopyButton({
    text
}: CodeCopyButtonProps) {
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
            className="h-8 w-8 bg-background/10 hover:bg-background/20 backdrop-blur-sm text-white border-white/10 border"
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
    );
});
