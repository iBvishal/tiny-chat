/**
 * Error handling utilities for tiny-chat
 */

import { ChatError } from "./chat-client";

/**
 * Standardized error messages for common API and network issues
 */
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED:
    "The site's free Gemini quota is used up for now. Add your own API key from the model menu, or try again later.",
  OWN_KEY_QUOTA_EXCEEDED:
    "Your API key has hit its quota. Models without a free tier, like Gemini 4 Argon, need billing turned on for the key's Google Cloud project.",
  INVALID_API_KEY:
    "The site's Gemini API key isn't working right now. You can add your own key from the model menu.",
  INVALID_OWN_API_KEY: "Google rejected your API key. Check or replace it from the model menu.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  DEFAULT: "An error occurred. Please try again.",
  REQUEST_FAILED: "Request failed. Please try again.",
} as const;

/**
 * True when a request was cancelled on purpose, for example by the stop button
 */
export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

/**
 * Parses an unknown error into a user-friendly message
 */
export function parseError(err: unknown): string {
  console.error("Error detected:", err);

  if (err instanceof ChatError) {
    if (err.status === 429 || err.message.toLowerCase().includes("quota")) {
      return err.ownKey ? ERROR_MESSAGES.OWN_KEY_QUOTA_EXCEEDED : ERROR_MESSAGES.QUOTA_EXCEEDED;
    }
    if (/api key not valid|api_key_invalid|api key expired/i.test(err.message)) {
      return err.ownKey ? ERROR_MESSAGES.INVALID_OWN_API_KEY : ERROR_MESSAGES.INVALID_API_KEY;
    }
    return err.message || ERROR_MESSAGES.REQUEST_FAILED;
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    // Browsers report a dropped connection as a TypeError: "Failed to fetch"
    // (Chrome), "NetworkError…" (Firefox) or "Load failed" (Safari).
    if (err.name === "TypeError" && /fetch|network|load failed/.test(msg)) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    return err.message || ERROR_MESSAGES.REQUEST_FAILED;
  }

  return ERROR_MESSAGES.DEFAULT;
}
