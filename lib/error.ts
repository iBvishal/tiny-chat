/**
 * Error handling utilities for tiny-chat
 */

import { ChatError } from "./chat-client";

/**
 * Standardized error messages for common API and network issues
 */
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED: "API quota exceeded. Please try again later.",
  INVALID_API_KEY: "Invalid API key. Please check your configuration.",
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
      return ERROR_MESSAGES.QUOTA_EXCEEDED;
    }
    if (/api key not valid|api_key_invalid/i.test(err.message)) {
      return ERROR_MESSAGES.INVALID_API_KEY;
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
