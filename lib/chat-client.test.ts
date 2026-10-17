import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatError, fitRequest, streamChat } from "./chat-client";
import type { Attachment, ChatRequest, StreamEvent } from "./types";

function attachment(name: string, size: number): Attachment {
  return { id: name, name, mimeType: "image/png", data: "A".repeat(size), size };
}

function request(...attachmentSizes: number[]): ChatRequest {
  return {
    model: "gemini-3.8-flash",
    system: "",
    messages: attachmentSizes.map((size, i) => ({
      role: "user",
      content: `turn ${i}`,
      attachments: [attachment(`file-${i}.png`, size)],
    })),
  };
}

describe("fitRequest", () => {
  it("returns the request unchanged when it fits", () => {
    const original = request(100, 100);
    expect(fitRequest(original, 10_000)).toBe(original);
  });

  it("leaves out the oldest attachments first and says so in the text", () => {
    const fitted = fitRequest(request(4000, 4000, 4000), 9000);

    expect(fitted.messages[0].attachments).toBeUndefined();
    expect(fitted.messages[0].content).toBe(
      "turn 0\n\n[Attachments left out to fit the size limit: file-0.png]",
    );
    expect(fitted.messages[1].attachments).toHaveLength(1);
    expect(fitted.messages[2].attachments).toHaveLength(1);
  });

  it("never drops the latest turn's attachments", () => {
    expect(() => fitRequest(request(100, 20_000), 10_000)).toThrow(ChatError);
  });
});

async function drain(events: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> {
  const result: StreamEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
}

describe("streamChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const sse = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hi!" }] } }] })}\n\n`;

  it("goes through /api/chat without a key of its own", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(sse));
    vi.stubGlobal("fetch", fetch);

    expect(await drain(streamChat(request(1), {}))).toEqual([{ type: "text", text: "Hi!" }]);
    expect(fetch).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
  });

  it("calls Gemini directly with the user's own key", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(sse));
    vi.stubGlobal("fetch", fetch);

    await drain(streamChat(request(1), { apiKey: "user-key" }));

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(
      /^https:\/\/generativelanguage\.googleapis\.com\/.+:streamGenerateContent\?alt=sse$/,
    );
    expect(init?.headers).toMatchObject({ "x-goog-api-key": "user-key" });
  });

  it("throws the server's error message with its status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: { message: "Slow down" } }, { status: 429 })),
    );

    await expect(drain(streamChat(request(1), {}))).rejects.toMatchObject({
      name: "ChatError",
      message: "Slow down",
      status: 429,
    });
  });
});
