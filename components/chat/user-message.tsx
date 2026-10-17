"use client";

import * as React from "react";
import { Copy, Check, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USER_MESSAGE_PREVIEW_LIMIT } from "@/lib/constants";
import { MarkdownContent } from "./markdown-content";

type UserMessageProps = {
    content: string;
    onEdit: (text: string) => void;
};

/**
 * Component for displaying user messages in the chat
 * Handles markdown, code blocks, and expansion for long messages
 */
export const UserMessage = React.memo(function UserMessage({
    content,
    onEdit
}: UserMessageProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const isLong = content.length > USER_MESSAGE_PREVIEW_LIMIT;
    const displayContent = isLong && !isExpanded ? content.slice(0, USER_MESSAGE_PREVIEW_LIMIT) + "..." : content;

    const handleCopy = () => {
        void navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-2 group items-end">
            <div className="flex items-center justify-end gap-2 w-full">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/70 hover:text-foreground hover:bg-muted"
                        onClick={() => onEdit(content)}
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="bg-muted/60 px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%]">
                    <MarkdownContent content={displayContent} />
                </div>
            </div>

            {isLong && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground underline w-fit"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
});
