/**
 * Application-wide constants
 * Centralized configuration values for easy maintenance
 */

// ============================================================================
// Animation & Timing Constants
// ============================================================================

/**
 * Minimum duration for typewriter animation effect
 * Ensures smooth visual feedback even with fast API responses
 */
export const MIN_ANIMATION_DURATION = 3000; // 3 seconds

/**
 * Typewriter effect speeds (in milliseconds)
 */
export const TYPEWRITER_SPEED = {
    FORWARD: 200,  // Speed when typing forward
    REVERSE: 100,  // Speed when deleting
    PAUSE_AT_WORD: 2000, // Pause duration when word is complete
} as const;

/**
 * Thinking animation speeds (in milliseconds)
 */
export const THINKING_ANIMATION_SPEED = {
    FORWARD: 80,   // Speed when typing forward
    REVERSE: 40,   // Speed when deleting
    PAUSE_AT_WORD: 1500, // Pause duration when word is complete
} as const;

/**
 * Blink animation intervals (in milliseconds)
 */
export const BLINK_INTERVAL = {
    TITLE: 800,    // Cursor blink speed for title
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
 * LocalStorage key for chat metadata
 */
export const STORAGE_KEYS = {
    METADATA: "tiny_chat_sessions",
    CONTENT_PREFIX: "tiny_chat_content_",
} as const;

// ============================================================================
// Gemini API Configuration
// ============================================================================

/**
 * Available models for chat
 */
export const AVAILABLE_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", category: "Fast & Efficient" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", category: "Ultra Fast" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", category: "Balanced" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", category: "Advanced" },
] as const;

/**
 * Default model used for new chats
 */
export const DEFAULT_MODEL = "gemini-2.5-flash";

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
export const TITLE_WORDS = [
    "thinks",
    "dreams",
    "chat",
    "ideas",
    "musings",
    "thoughts",
] as const;

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
