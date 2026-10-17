import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getThread } from "./chat-tree";
import type { Chat } from "./types";

class MemoryStorage {
  readonly items = new Map<string, string>();

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }

  removeItem(key: string) {
    this.items.delete(key);
  }
}

let storage: typeof import("./storage");
let local: MemoryStorage;

beforeEach(async () => {
  // A fresh database, localStorage and module state for every test.
  local = new MemoryStorage();
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("localStorage", local);
  vi.resetModules();
  storage = await import("./storage");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function chat(id: string, updatedAt: number, isPinned = false): Chat {
  return {
    meta: { id, title: `Chat ${id}`, updatedAt, ...(isPinned && { isPinned }) },
    data: {
      messages: [{ id: "m1", parentId: null, role: "user", content: "Hi", createdAt: updatedAt }],
      leafId: "m1",
    },
  };
}

describe("chat storage", () => {
  it("saves, lists, loads and deletes chats", async () => {
    await storage.saveChat(chat("old", 1));
    await storage.saveChat(chat("new", 2));
    await storage.saveChat(chat("pinned", 0, true));

    expect((await storage.listChats()).map((c) => c.id)).toEqual(["pinned", "new", "old"]);
    expect(await storage.loadChat("new")).toEqual(chat("new", 2));

    await storage.deleteChat("new");
    expect(await storage.loadChat("new")).toBeNull();
    expect((await storage.listChats()).map((c) => c.id)).toEqual(["pinned", "old"]);
  });

  it("updates metadata without touching messages", async () => {
    await storage.saveChat(chat("a", 1));

    expect(await storage.updateChatMeta("a", { title: "Renamed", isPinned: true })).toMatchObject({
      title: "Renamed",
      isPinned: true,
    });
    expect((await storage.loadChat("a"))?.data).toEqual(chat("a", 1).data);
    expect(await storage.updateChatMeta("missing", { title: "x" })).toBeNull();
  });

  it("keeps a rename made while the chat was open, unless asked to change it", async () => {
    await storage.saveChat(chat("a", 1));
    await storage.updateChatMeta("a", { title: "Renamed in the sidebar" });

    await storage.saveChat(chat("a", 1), { updatedAt: 5 });
    expect((await storage.loadChat("a"))?.meta).toMatchObject({
      title: "Renamed in the sidebar",
      updatedAt: 5,
    });

    await storage.saveChat(chat("a", 1), { title: "New title" });
    expect((await storage.loadChat("a"))?.meta.title).toBe("New title");
  });
});

/**
 * Writes chats the way versions before IndexedDB did
 */
function seedLegacy() {
  local.setItem(
    "tiny_chat_sessions",
    JSON.stringify([
      { id: "abc123def", title: "Old chat", updatedAt: 100, isPinned: true },
      { id: "broken", title: 42 },
    ]),
  );
  local.setItem(
    "tiny_chat_content_abc123def",
    JSON.stringify([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
      { role: "system", content: "dropped" },
    ]),
  );
}

describe("migration from localStorage", () => {
  it("moves old chats into IndexedDB and removes the old copies", async () => {
    seedLegacy();

    const chats = await storage.listChats();
    expect(chats).toEqual([{ id: "abc123def", title: "Old chat", updatedAt: 100, isPinned: true }]);

    const migrated = await storage.loadChat("abc123def");
    const thread = getThread(migrated!.data.messages, migrated!.data.leafId);
    expect(thread.map((m) => [m.role, m.content])).toEqual([
      ["user", "Hello"],
      ["assistant", "Hi there"],
    ]);
    expect(local.items.size).toBe(0);
  });

  it("never overwrites a chat that IndexedDB already has", async () => {
    seedLegacy();
    await storage.listChats();
    await storage.updateChatMeta("abc123def", { title: "Renamed" });

    // A tab still running the old version writes its copy again.
    seedLegacy();
    vi.resetModules();
    const reloaded: typeof import("./storage") = await import("./storage");

    expect((await reloaded.listChats()).map((c) => c.title)).toEqual(["Renamed"]);
    expect(local.items.size).toBe(0);
  });
});
