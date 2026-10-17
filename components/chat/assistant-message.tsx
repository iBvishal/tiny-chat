"use client";

import * as React from "react";

import { TypewriterThinking } from "@/components/typewriter/typewriter-thinking";

import { MarkdownContent } from "./markdown-content";
import { ResponseActions } from "./response-actions";

type AssistantMessageProps = {
  content: string;
  isLast: boolean;
  isLoading: boolean;
  onListen: (text: string, speaking: boolean) => boolean;
  onRedo: () => void;
};

/**
 * Component for displaying assistant responses
 * Includes thinking indicator, markdown content, and action buttons
 */
export const AssistantMessage = React.memo(function AssistantMessage({
  content,
  isLoading,
  onListen,
  onRedo,
}: AssistantMessageProps) {
  if (!content && !isLoading) return null;

  return (
    <div className="group flex max-w-full flex-col items-start">
      {/* Show thinking indicator if it's the last message and still loading/no content */}
      <TypewriterThinking done={!!content} />

      {content && (
        <div className="max-w-full overflow-hidden pt-1 text-sm break-words text-foreground">
          <MarkdownContent content={content} />
          <ResponseActions content={content} onListen={onListen} onRedo={onRedo} />
        </div>
      )}
    </div>
  );
});
