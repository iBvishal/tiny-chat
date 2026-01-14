"use client";

import * as React from "react";
import { MarkdownContent } from "./markdown-content";
import { ResponseActions } from "./response-actions";
import { TypewriterThinking } from "@/components/typewriter/typewriter-thinking";

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
    onRedo
}: AssistantMessageProps) {
    if (!content && !isLoading) return null;

    return (
        <div className="flex flex-col group items-start max-w-full">
            {/* Show thinking indicator if it's the last message and still loading/no content */}
            <TypewriterThinking done={!!content} />

            {content && (
                <div className="max-w-full text-sm break-words overflow-hidden text-foreground pt-1">
                    <MarkdownContent content={content} />
                    <ResponseActions
                        content={content}
                        onListen={onListen}
                        onRedo={onRedo}
                    />
                </div>
            )}
        </div>
    );
});
