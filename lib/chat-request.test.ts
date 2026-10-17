import { describe, expect, it } from "vitest";

import { parseChatRequest } from "./chat-request";

const valid = {
  model: "gemini-3.8-flash",
  system: "Be brief.",
  messages: [{ role: "user", content: "Hi" }],
};

describe("parseChatRequest", () => {
  it("accepts a valid request and drops unknown fields", () => {
    expect(
      parseChatRequest({
        ...valid,
        apiKey: "nope",
        messages: [{ ...valid.messages[0], extra: 1 }],
      }),
    ).toEqual({
      ...valid,
      webSearch: false,
      thoughts: false,
    });
  });

  it("keeps web search and thoughts when asked for", () => {
    expect(parseChatRequest({ ...valid, webSearch: true, thoughts: true })).toMatchObject({
      webSearch: true,
      thoughts: true,
    });
  });

  it("accepts supported attachments", () => {
    const attachment = {
      id: "a",
      name: "notes.txt",
      mimeType: "text/plain",
      data: "aGk=",
      size: 2,
    };
    const request = {
      ...valid,
      messages: [{ role: "user", content: "", attachments: [attachment] }],
    };

    expect(parseChatRequest(request)?.messages[0].attachments).toEqual([attachment]);
  });

  it.each([
    ["an unknown model", { ...valid, model: "gemini-1.5-pro" }],
    ["a missing system prompt", { ...valid, system: undefined }],
    ["an oversized system prompt", { ...valid, system: "x".repeat(8001) }],
    ["no messages", { ...valid, messages: [] }],
    ["an unknown role", { ...valid, messages: [{ role: "system", content: "Hi" }] }],
    ["non-text content", { ...valid, messages: [{ role: "user", content: 42 }] }],
    ["a non-boolean option", { ...valid, webSearch: "yes" }],
    [
      "an unsupported attachment type",
      {
        ...valid,
        messages: [
          {
            role: "user",
            content: "",
            attachments: [
              { id: "a", name: "a.exe", mimeType: "application/x-msdownload", data: "", size: 0 },
            ],
          },
        ],
      },
    ],
    ["something that is not an object", "hello"],
  ])("rejects %s", (_, request) => {
    expect(parseChatRequest(request)).toBeNull();
  });
});
