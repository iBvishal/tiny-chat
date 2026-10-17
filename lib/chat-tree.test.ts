import { describe, expect, it } from "vitest";

import { fromTurns, getSiblings, getThread, latestLeaf, newId } from "./chat-tree";
import type { Message } from "./types";

function message(id: string, parentId: string | null): Message {
  return { id, parentId, role: "user", content: id, createdAt: 0 };
}

// a ─ b ─ c
//   └ d ─ e
//       └ f
const messages = [
  message("a", null),
  message("b", "a"),
  message("c", "b"),
  message("d", "a"),
  message("e", "d"),
  message("f", "d"),
];

describe("getThread", () => {
  it("walks from the first message down to the leaf", () => {
    expect(getThread(messages, "c").map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(getThread(messages, "f").map((m) => m.id)).toEqual(["a", "d", "f"]);
  });

  it("is empty without a leaf and survives a cycle", () => {
    expect(getThread(messages, null)).toEqual([]);
    const cyclic = [message("x", "y"), message("y", "x")];
    expect(getThread(cyclic, "x").map((m) => m.id)).toEqual(["y", "x"]);
  });
});

describe("getSiblings", () => {
  it("returns messages with the same parent, oldest first", () => {
    expect(getSiblings(messages, messages[3]).map((m) => m.id)).toEqual(["b", "d"]);
    expect(getSiblings(messages, messages[0]).map((m) => m.id)).toEqual(["a"]);
  });
});

describe("latestLeaf", () => {
  it("follows the newest child to the end of the branch", () => {
    expect(latestLeaf(messages, "a")).toBe("f");
    expect(latestLeaf(messages, "b")).toBe("c");
    expect(latestLeaf(messages, "e")).toBe("e");
  });
});

describe("fromTurns", () => {
  it("chains turns into one branch", () => {
    const data = fromTurns(
      [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
      ],
      1000,
    );

    const thread = getThread(data.messages, data.leafId);
    expect(thread.map((m) => [m.role, m.content, m.createdAt])).toEqual([
      ["user", "Hi", 1000],
      ["assistant", "Hello", 1001],
    ]);
    expect(thread[0].parentId).toBeNull();
  });

  it("handles an empty chat", () => {
    expect(fromTurns([], 0)).toEqual({ messages: [], leafId: null });
  });
});

describe("newId", () => {
  it("makes distinct hex IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, newId));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{24}$/);
  });
});
