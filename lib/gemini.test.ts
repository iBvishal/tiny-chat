import { describe, expect, it } from "vitest";

import { chunkEvents, readError, readEvents, toGeminiBody } from "./gemini";
import type { StreamEvent } from "./types";

function streamOf(...pieces: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece));
      controller.close();
    },
  });
}

async function collect(events: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> {
  const result: StreamEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
}

describe("toGeminiBody", () => {
  it("maps roles, attachments and options to the Gemini request shape", () => {
    const body = toGeminiBody({
      model: "gemini-3.8-flash",
      system: "Be brief.",
      messages: [
        {
          role: "user",
          content: "What is this?",
          attachments: [{ id: "a", name: "cat.png", mimeType: "image/png", data: "AAAA", size: 3 }],
        },
        { role: "assistant", content: "A cat." },
      ],
      webSearch: true,
      thoughts: true,
    });

    expect(body).toEqual({
      systemInstruction: { parts: [{ text: "Be brief." }] },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: "AAAA" } },
            { text: "What is this?" },
          ],
        },
        { role: "model", parts: [{ text: "A cat." }] },
      ],
      tools: [{ googleSearch: {} }],
      generationConfig: { thinkingConfig: { includeThoughts: true } },
    });
  });

  it("drops empty turns and leaves out options that are off", () => {
    const body = toGeminiBody({
      model: "gemini-3.8-flash",
      system: "",
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "" },
      ],
    });

    expect(body.contents).toEqual([{ role: "user", parts: [{ text: "Hi" }] }]);
    expect(body).not.toHaveProperty("tools");
    expect(body).not.toHaveProperty("generationConfig");
  });
});

describe("chunkEvents", () => {
  it("separates thought summaries from answer text", () => {
    const events = chunkEvents({
      candidates: [
        { content: { parts: [{ text: "Considering…", thought: true }, { text: "Hello" }, {}] } },
      ],
    });

    expect(events).toEqual([
      { type: "thought", text: "Considering…" },
      { type: "text", text: "Hello" },
    ]);
  });

  it("collects web sources and the search suggestions widget", () => {
    const events = chunkEvents({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://example.com/a", title: "example.com" } },
              { web: { uri: "https://example.org/b" } },
              {},
            ],
            searchEntryPoint: { renderedContent: "<div>chips</div>" },
          },
        },
      ],
    });

    expect(events).toEqual([
      {
        type: "sources",
        sources: [
          { uri: "https://example.com/a", title: "example.com" },
          { uri: "https://example.org/b", title: "https://example.org/b" },
        ],
      },
      { type: "searchSuggestions", html: "<div>chips</div>" },
    ]);
  });

  it("reports blocked prompts and unusual finish reasons", () => {
    expect(chunkEvents({ promptFeedback: { blockReason: "SAFETY" } })).toEqual([
      { type: "blocked", reason: "SAFETY" },
    ]);
    expect(chunkEvents({ candidates: [{ finishReason: "RECITATION" }] })).toEqual([
      { type: "blocked", reason: "RECITATION" },
    ]);
    expect(chunkEvents({ candidates: [{ finishReason: "STOP" }] })).toEqual([]);
    expect(chunkEvents({ candidates: [{ finishReason: "MAX_TOKENS" }] })).toEqual([]);
  });
});

describe("readEvents", () => {
  it("parses data lines split across network chunks", async () => {
    const first = JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hel" }] } }] });
    const second = JSON.stringify({ candidates: [{ content: { parts: [{ text: "lo" }] } }] });
    const sse = `data: ${first}\r\n\r\ndata: ${second}\r\n\r\n`;

    const events = await collect(
      readEvents(streamOf(sse.slice(0, 10), sse.slice(10, 70), sse.slice(70))),
    );

    expect(events).toEqual([
      { type: "text", text: "Hel" },
      { type: "text", text: "lo" },
    ]);
  });

  it("reads a final line without a trailing newline", async () => {
    const chunk = JSON.stringify({ candidates: [{ content: { parts: [{ text: "end" }] } }] });

    expect(await collect(readEvents(streamOf(`data: ${chunk}`)))).toEqual([
      { type: "text", text: "end" },
    ]);
  });
});

describe("readError", () => {
  it("reads Gemini's error message, also when it is wrapped in an array", async () => {
    const error = { error: { code: 400, message: "API key not valid." } };

    expect(await readError(new Response(JSON.stringify(error), { status: 400 }))).toBe(
      "API key not valid.",
    );
    expect(await readError(new Response(JSON.stringify([error]), { status: 400 }))).toBe(
      "API key not valid.",
    );
  });

  it("falls back to the body text, then the status", async () => {
    expect(await readError(new Response("Bad gateway", { status: 502 }))).toBe("Bad gateway");
    expect(await readError(new Response("", { status: 500 }))).toBe(
      "Request failed with status 500",
    );
  });
});
