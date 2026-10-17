"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";

import { CodeCopyButton } from "./code-copy-button";

type MarkdownContentProps = {
  content: string;
};

/**
 * Shared markdown rendering component
 * Ensures consistent formatting and code block behavior across user and assistant messages
 */
export const MarkdownContent = React.memo(function MarkdownContent({
  content,
}: MarkdownContentProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-hidden break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({
            inline,
            className,
            children,
            ...props
          }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <div className="group/code relative">
                <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover/code:opacity-100">
                  <CodeCopyButton text={codeString} />
                </div>
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="!my-0 !bg-transparent"
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
