/**
 * Core type definitions for tiny-chat
 * Centralized types for better maintainability and reusability
 */

export type Role = "user" | "assistant";

/**
 * A file sent with a user message, stored inline as base64
 */
export type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  /** Base64 data without the `data:` prefix */
  data: string;
  size: number;
};

/**
 * A web page Gemini used to ground a reply
 */
export type Source = {
  title: string;
  uri: string;
};

/**
 * A single message. Messages form a tree through `parentId`, so an edited
 * message or a regenerated reply becomes a sibling instead of replacing the
 * original.
 */
export type Message = {
  id: string;
  parentId: string | null;
  role: Role;
  content: string;
  createdAt: number;
  model?: string;
  /** The user stopped the reply before it finished */
  stopped?: boolean;
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
 * Every message of a chat, across all branches, plus the branch on screen
 */
export type ChatData = {
  messages: Message[];
  /** Last message of the branch on screen */
  leafId: string | null;
};

export type Chat = {
  meta: ChatMetadata;
  data: ChatData;
};

/**
 * Available Gemini AI models
 */
export type GeminiModel = {
  id: string;
  name: string;
  category: string;
  /** Allowed on the site's shared key. Models without a free tier need the user's own key. */
  sharedKey: boolean;
  /** Supports thinking, so thought summaries can be requested */
  thinking: boolean;
};

/**
 * One turn sent to Gemini
 */
export type ChatTurn = {
  role: Role;
  content: string;
  attachments?: Attachment[];
};

/**
 * What the browser sends to `/api/chat`, and what both transports turn into a
 * Gemini request
 */
export type ChatRequest = {
  model: string;
  system: string;
  messages: ChatTurn[];
  webSearch?: boolean;
  thoughts?: boolean;
};

/**
 * One piece of a streamed reply
 */
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "thought"; text: string }
  | { type: "sources"; sources: Source[] }
  | { type: "searchSuggestions"; html: string }
  | { type: "blocked"; reason: string };
