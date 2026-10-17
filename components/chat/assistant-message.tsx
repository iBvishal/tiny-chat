"use client";

import * as React from "react";

import { TypewriterThinking } from "@/components/typewriter/typewriter-thinking";

import { MarkdownContent } from "./markdown-content";
import { ResponseActions } from "./response-actions";

type AssistantMessageProps = {
  id: string;
  content: string;
  isLoading: boolean;
  onListen: (text: string, speaking: boolean) => boolean;
  onRedo: (id: string) => void;
};

/**
 * Component for displaying assistant responses
 * Includes thinking indicator, markdown content, and action buttons
 */
export const AssistantMessage = React.memo(function AssistantMessage({
  id,
  content,
  isLoading,
  onListen,
  onRedo,
}: AssistantMessageProps) {
  const handleRedo = React.useCallback(() => onRedo(id), [id, onRedo]);

  if (!content && !isLoading) return null;

  return (
    <div className="group flex max-w-full flex-col items-start">
      {/* Show thinking indicator if it's the last message and still loading/no content */}
      <TypewriterThinking done={!!content} />

      {content && (
        <div className="max-w-full overflow-hidden pt-1 text-sm break-words text-foreground">
          <MarkdownContent content={content} />
          {!isLoading && (
            <ResponseActions content={content} onListen={onListen} onRedo={handleRedo} />
          )}
        </div>
      )}
    </div>
  );
});
