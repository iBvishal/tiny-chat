/**
 * Error handling utilities for tiny-chat
 */

/**
 * Standardized error messages for common API and network issues
 */
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED: "API quota exceeded. Please check your billing or try again later.",
  INVALID_API_KEY: "Invalid API key. Please check your configuration.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  DEFAULT: "An error occurred. Please try again.",
  REQUEST_FAILED: "Request failed. Please try again.",
} as const;

/**
 * Parses an unknown error into a user-friendly message
 */
export function parseError(err: unknown): string {
  console.error("Error detected:", err);

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    if (msg.includes("quota") || msg.includes("429")) {
      return ERROR_MESSAGES.QUOTA_EXCEEDED;
    }

    if (msg.includes("api key") || msg.includes("auth")) {
      return ERROR_MESSAGES.INVALID_API_KEY;
    }

    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    return err.message || ERROR_MESSAGES.REQUEST_FAILED;
  }

  return ERROR_MESSAGES.DEFAULT;
}
