import { describe, expect, it, vi } from "vitest";

import { ChatError } from "./chat-client";
import { ERROR_MESSAGES, parseError } from "./error";

describe("parseError", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  it("suggests adding a key when the site's quota runs out", () => {
    expect(parseError(new ChatError("Resource exhausted", 429))).toBe(
      ERROR_MESSAGES.QUOTA_EXCEEDED,
    );
  });

  it("points at billing when the user's own key runs out", () => {
    expect(parseError(new ChatError("You exceeded your current quota", 429, true))).toBe(
      ERROR_MESSAGES.OWN_KEY_QUOTA_EXCEEDED,
    );
  });

  it("tells apart a bad site key and a bad user key", () => {
    const message = "API key not valid. Please pass a valid API key.";
    expect(parseError(new ChatError(message, 400))).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    expect(parseError(new ChatError(message, 400, true))).toBe(ERROR_MESSAGES.INVALID_OWN_API_KEY);
  });

  it("passes other messages through", () => {
    expect(parseError(new ChatError("This model needs your own Gemini API key.", 403))).toBe(
      "This model needs your own Gemini API key.",
    );
  });
});
