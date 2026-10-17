/**
 * Sends chat requests from the browser
 * With the user's own key, requests go straight to Gemini. Otherwise they go
 * through `/api/chat`, which adds the site's shared key on the server.
 */

import { readError, readEvents, streamGemini } from "./gemini";
import type { ChatRequest, StreamEvent } from "./types";

/** Vercel rejects request bodies over 4.5 MB */
const SHARED_KEY_LIMIT = 4_000_000;
/** Gemini rejects inline requests over 20 MB */
const OWN_KEY_LIMIT = 19_000_000;

export class ChatError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatError";
    this.status = status;
  }
}

/**
 * Keeps a request under a size limit by leaving out attachments from older
 * turns, oldest first. The latest turn always keeps its attachments.
 */
export function fitRequest(request: ChatRequest, limit: number): ChatRequest {
  if (JSON.stringify(request).length <= limit) return request;

  const messages = [...request.messages];
  const fits = () => JSON.stringify({ ...request, messages }).length <= limit;
  for (let i = 0; i < messages.length - 1 && !fits(); i++) {
    const turn = messages[i];
    if (!turn.attachments?.length) continue;

    const names = turn.attachments.map((attachment) => attachment.name).join(", ");
    messages[i] = {
      role: turn.role,
      content: `${turn.content}\n\n[Attachments left out to fit the size limit: ${names}]`.trim(),
    };
  }

  if (!fits()) {
    const megabytes = Math.floor(limit / 1_000_000);
    throw new ChatError(
      `The attachments are too large to send. The limit is about ${megabytes} MB.`,
    );
  }
  return { ...request, messages };
}

/**
 * Streams a reply as events
 */
export async function* streamChat(
  request: ChatRequest,
  options: { apiKey?: string | null; signal?: AbortSignal },
): AsyncGenerator<StreamEvent> {
  const { apiKey, signal } = options;
  const response = apiKey
    ? await streamGemini(fitRequest(request, OWN_KEY_LIMIT), apiKey, signal)
    : await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fitRequest(request, SHARED_KEY_LIMIT)),
        signal,
      });

  if (!response.ok || !response.body) {
    throw new ChatError(await readError(response), response.status);
  }
  yield* readEvents(response.body);
}
