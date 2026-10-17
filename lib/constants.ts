/**
 * Application-wide constants
 * Centralized configuration values for easy maintenance
 */

import type { GeminiModel } from "./types";

// ============================================================================
// Animation & Timing Constants
// ============================================================================

/**
 * Typewriter effect speeds (in milliseconds)
 */
export const TYPEWRITER_SPEED = {
  FORWARD: 200, // Speed when typing forward
  REVERSE: 100, // Speed when deleting
  PAUSE_AT_WORD: 2000, // Pause duration when word is complete
} as const;

/**
 * Thinking animation speeds (in milliseconds)
 */
export const THINKING_ANIMATION_SPEED = {
  FORWARD: 80, // Speed when typing forward
  REVERSE: 40, // Speed when deleting
  PAUSE_AT_WORD: 1500, // Pause duration when word is complete
} as const;

/**
 * Blink animation intervals (in milliseconds)
 */
export const BLINK_INTERVAL = {
  TITLE: 800, // Cursor blink speed for title
  THINKING: 500, // Cursor blink speed for thinking animation
} as const;

// ============================================================================
// UI Constraints
// ============================================================================

/**
 * Maximum height for the textarea input (in pixels)
 * Approximately 3 lines at 24px line-height
 */
export const MAX_TEXTAREA_HEIGHT = 72;

/**
 * Character limit before "show more" appears in user messages
 */
export const USER_MESSAGE_PREVIEW_LIMIT = 200;

/**
 * Tooltip delay (in milliseconds)
 */
export const TOOLTIP_DELAY = 200;

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * localStorage keys used before chats moved to IndexedDB
 * Chats found under them are migrated once, then removed.
 */
export const LEGACY_STORAGE_KEYS = {
  METADATA: "tiny_chat_sessions",
  CONTENT_PREFIX: "tiny_chat_content_",
} as const;

// ============================================================================
// Gemini API Configuration
// ============================================================================

/**
 * Available models for chat
 * Models without a free tier only work with the user's own API key, so the
 * site's shared key never pays for them.
 */
export const AVAILABLE_MODELS: readonly GeminiModel[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    category: "Fast & Capable",
    sharedKey: true,
    thinking: true,
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    category: "Fastest",
    sharedKey: true,
    thinking: true,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    category: "Most capable",
    sharedKey: false,
    thinking: true,
  },
];

/**
 * Default model used for new chats
 */
export const DEFAULT_MODEL = "gemini-3.8-flash";

/**
 * Small, cheap model used to write chat titles
 */
export const TITLE_MODEL = "gemini-3.5-flash-lite";

/**
 * Looks up a model, falling back to the default for retired or unknown IDs
 */
export function getModel(id: string | null | undefined): GeminiModel {
  return (
    AVAILABLE_MODELS.find((model) => model.id === id) ??
    AVAILABLE_MODELS.find((model) => model.id === DEFAULT_MODEL)!
  );
}

/**
 * Like getModel, but also falls back to the default for a model that needs
 * the user's own key when there isn't one
 */
export function getUsableModel(id: string | null | undefined, hasOwnKey: boolean): GeminiModel {
  const model = getModel(id);
  return model.sharedKey || hasOwnKey ? model : getModel(DEFAULT_MODEL);
}

/**
 * Where users create a Gemini API key
 */
export const API_KEY_URL = "https://aistudio.google.com/apikey";

/**
 * Longest system prompt the server accepts
 */
export const MAX_SYSTEM_PROMPT_LENGTH = 8000;

/**
 * File types Gemini accepts inline. Text files of any kind are sent as text/plain.
 */
export const ATTACHMENT_MIME_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
];

/**
 * System prompt defining the AI assistant's personality and behavior
 */
export const SYSTEM_PROMPT = `You are Tiny Chat, a minimal and helpful AI assistant. 
Your responses should be concise, accurate, and formatted using clean Markdown. 
If asked about your identity, you are Tiny Chat, built as a lightweight client-side application using the Gemini API.
Always prefer brevity and clarity.`;

// ============================================================================
// Typewriter Word Lists
// ============================================================================

/**
 * Words cycled through in the title typewriter effect
 */
export const TITLE_WORDS = ["thinks", "dreams", "chat", "ideas", "musings", "thoughts"] as const;

/**
 * Words cycled through in the thinking/loading animation
 */
export const THINKING_WORDS = [
  "thinking...",
  "reasoning...",
  "processing...",
  "pondering...",
  "searching...",
  "analysing...",
  "responding...",
] as const;
