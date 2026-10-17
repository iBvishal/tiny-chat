"use client";

import { Copy, Check, Edit } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { USER_MESSAGE_PREVIEW_LIMIT } from "@/lib/constants";

import { MarkdownContent } from "./markdown-content";

type UserMessageProps = {
  id: string;
  content: string;
  onEdit: (id: string, text: string) => void;
};

/**
 * Component for displaying user messages in the chat
 * Handles markdown, code blocks, and expansion for long messages
 */
export const UserMessage = React.memo(function UserMessage({
  id,
  content,
  onEdit,
}: UserMessageProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const isLong = content.length > USER_MESSAGE_PREVIEW_LIMIT;
  const displayContent =
    isLong && !isExpanded ? content.slice(0, USER_MESSAGE_PREVIEW_LIMIT) + "..." : content;

  const handleCopy = () => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex flex-col items-end gap-2">
      <div className="flex w-full items-center justify-end gap-2">
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
            onClick={() => onEdit(id, content)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-muted/60 px-4 py-2 sm:max-w-[75%]">
          <MarkdownContent content={displayContent} />
        </div>
      </div>

      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 w-fit text-xs text-muted-foreground underline hover:text-foreground"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
});
