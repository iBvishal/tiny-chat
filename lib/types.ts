/**
 * Core type definitions for tiny-chat
 * Centralized types for better maintainability and reusability
 */

/**
 * Represents a single message in a chat conversation
 */
export type Message = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Lightweight chat metadata for sidebar display
 * Stored separately from message content for performance
 */
export type ChatMetadata = {
  id: string;
  title: string;
  updatedAt: number;
  isPinned?: boolean;
};

/**
 * Complete chat session including metadata and messages
 */
export type ChatSession = ChatMetadata & {
  messages: Message[];
};

/**
 * Props for ReactMarkdown code component
 * Used for syntax highlighting in chat messages
 */
export type MarkdownCodeProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Available Gemini AI models
 */
export type GeminiModel = {
  id: string;
  name: string;
  category: string;
};
