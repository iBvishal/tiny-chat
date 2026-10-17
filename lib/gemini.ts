/**
 * Minimal Gemini REST client
 * Runs in the browser (with the user's own key) and on the server (with the
 * site's shared key), so it only uses fetch and web streams.
 */

import type { ChatRequest, Source, StreamEvent } from "./types";

export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

type GeminiPart = {
  text?: string;
  thought?: boolean;
  inlineData?: { mimeType: string; data: string };
};

export type GeminiChunk = {
  candidates?: {
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
    groundingMetadata?: {
      groundingChunks?: { web?: { uri?: string; title?: string } }[];
      searchEntryPoint?: { renderedContent?: string };
    };
  }[];
  promptFeedback?: { blockReason?: string };
};

/**
 * Finish reasons that mean the reply ended normally
 */
const NORMAL_FINISH_REASONS = new Set(["STOP", "MAX_TOKENS", "FINISH_REASON_UNSPECIFIED"]);

/**
 * Builds the `streamGenerateContent` request body
 */
export function toGeminiBody(request: ChatRequest) {
  const contents = request.messages
    .map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [
        ...(turn.attachments ?? []).map((attachment) => ({
          inlineData: { mimeType: attachment.mimeType, data: attachment.data },
        })),
        ...(turn.content ? [{ text: turn.content }] : []),
      ],
    }))
    .filter((content) => content.parts.length > 0);

  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents,
    ...(request.webSearch && { tools: [{ googleSearch: {} }] }),
    ...(request.thoughts && { generationConfig: { thinkingConfig: { includeThoughts: true } } }),
  };
}

/**
 * Starts a streamed reply. The response body is a server-sent event stream.
 */
export function streamGemini(
  request: ChatRequest,
  apiKey: string,
  signal?: AbortSignal,
): Promise<Response> {
  const url = `${GEMINI_API_URL}/models/${encodeURIComponent(request.model)}:streamGenerateContent?alt=sse`;
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(toGeminiBody(request)),
    signal,
  });
}

/**
 * Turns one streamed response chunk into events
 */
export function chunkEvents(chunk: GeminiChunk): StreamEvent[] {
  const events: StreamEvent[] = [];
  const blockReason = chunk.promptFeedback?.blockReason;
  if (blockReason) events.push({ type: "blocked", reason: blockReason });

  const candidate = chunk.candidates?.[0];
  if (!candidate) return events;

  for (const part of candidate.content?.parts ?? []) {
    if (part.text) events.push({ type: part.thought ? "thought" : "text", text: part.text });
  }

  const sources: Source[] = [];
  for (const groundingChunk of candidate.groundingMetadata?.groundingChunks ?? []) {
    const uri = groundingChunk.web?.uri;
    if (uri) sources.push({ uri, title: groundingChunk.web?.title || uri });
  }
  if (sources.length > 0) events.push({ type: "sources", sources });

  const html = candidate.groundingMetadata?.searchEntryPoint?.renderedContent;
  if (html) events.push({ type: "searchSuggestions", html });

  const finishReason = candidate.finishReason;
  if (finishReason && !NORMAL_FINISH_REASONS.has(finishReason)) {
    events.push({ type: "blocked", reason: finishReason });
  }
  return events;
}

/**
 * Reads a server-sent event stream of Gemini chunks
 */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- a stream can only be read one chunk at a time
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) yield* lineEvents(line);
  }
  yield* lineEvents(buffer + decoder.decode());
}

function lineEvents(line: string): StreamEvent[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return [];
  const json = trimmed.slice("data:".length).trim();
  if (!json) return [];
  // chunkEvents reads every field optionally, so a partial chunk is safe.
  const chunk: GeminiChunk = JSON.parse(json);
  return chunkEvents(chunk);
}

/**
 * Extracts the error message from a failed response
 * Gemini sends `{ error: { message } }`, sometimes wrapped in an array.
 */
export async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const parsed: unknown = JSON.parse(text);
    const message = errorMessage(Array.isArray(parsed) ? parsed[0] : parsed);
    if (message) return message;
  } catch {
    // Not JSON; fall through to the raw text.
  }
  return text.trim() || `Request failed with status ${response.status}`;
}

function errorMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const { error } = body;
  if (typeof error !== "object" || error === null || !("message" in error)) return null;
  return typeof error.message === "string" && error.message ? error.message : null;
}
