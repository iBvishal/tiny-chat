/**
 * Chat storage in IndexedDB
 * Metadata and messages are stored under separate keys so the sidebar can
 * list chats without loading every message. IndexedDB holds far more than
 * localStorage's 5 MB, which matters once messages carry attachments.
 */

import { createStore, delMany, get, getMany, keys, set, setMany, type UseStore } from "idb-keyval";

import { fromTurns } from "./chat-tree";
import { LEGACY_STORAGE_KEYS } from "./constants";
import type { Chat, ChatData, ChatMetadata, Role } from "./types";

const META_PREFIX = "meta:";
const DATA_PREFIX = "data:";
const CHANGE_EVENT = "tiny-chat:chats-changed";

let store: UseStore | null = null;
let migration: Promise<void> | null = null;

/**
 * Thrown when the browser has no room left for the chat
 */
export class StorageFullError extends Error {
  constructor() {
    super("Your browser's storage for this site is full. Delete some chats to make room.");
    this.name = "StorageFullError";
  }
}

// Opened lazily: idb-keyval opens the database as soon as a store is created,
// and this module is also evaluated during server rendering.
function getStore(): UseStore {
  store ??= createStore("tiny-chat", "chats");
  return store;
}

async function ready(): Promise<UseStore> {
  migration ??= migrateFromLocalStorage().catch((error: unknown) => {
    // Leave the old data in place and try again on the next call.
    console.error("Could not move chats out of localStorage:", error);
    migration = null;
  });
  await migration;
  return getStore();
}

async function write(operation: () => Promise<void>): Promise<void> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new StorageFullError();
    }
    throw error;
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Pinned chats first, then the most recently updated
 */
export function sortChats(chats: readonly ChatMetadata[]): ChatMetadata[] {
  return chats.toSorted((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Calls `listener` whenever a chat is saved, changed or deleted
 */
export function onChatsChanged(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/**
 * Lists every chat's metadata, sorted for the sidebar
 */
export async function listChats(): Promise<ChatMetadata[]> {
  const db = await ready();
  const metaKeys = (await keys<string>(db)).filter((key) => key.startsWith(META_PREFIX));
  const metas = await getMany<ChatMetadata>(metaKeys, db);
  return sortChats(metas.filter((meta): meta is ChatMetadata => meta !== undefined));
}

export async function loadChat(id: string): Promise<Chat | null> {
  const db = await ready();
  const [meta, data] = await Promise.all([
    get<ChatMetadata>(META_PREFIX + id, db),
    get<ChatData>(DATA_PREFIX + id, db),
  ]);
  return meta && data ? { meta, data } : null;
}

export async function loadChatMeta(id: string): Promise<ChatMetadata | null> {
  const db = await ready();
  return (await get<ChatMetadata>(META_PREFIX + id, db)) ?? null;
}

/**
 * Saves a chat's messages and metadata together
 * Stored metadata wins over `chat.meta`, so a rename or pin made in the
 * sidebar while a reply streamed is kept. Pass the fields to change in
 * `metaChanges`.
 */
export async function saveChat(chat: Chat, metaChanges: Partial<ChatMetadata> = {}): Promise<void> {
  const db = await ready();
  const stored = await get<ChatMetadata>(META_PREFIX + chat.meta.id, db);
  const meta = { ...chat.meta, ...stored, ...metaChanges };
  await write(() =>
    setMany(
      [
        [META_PREFIX + meta.id, meta],
        [DATA_PREFIX + meta.id, chat.data],
      ],
      db,
    ),
  );
}

/**
 * Changes a chat's metadata, for example to rename or pin it
 */
export async function updateChatMeta(
  id: string,
  changes: Partial<ChatMetadata>,
): Promise<ChatMetadata | null> {
  const db = await ready();
  const stored = await get<ChatMetadata>(META_PREFIX + id, db);
  if (!stored) return null;
  const meta = { ...stored, ...changes, id };
  await write(() => set(META_PREFIX + id, meta, db));
  return meta;
}

export async function deleteChat(id: string): Promise<void> {
  const db = await ready();
  await write(() => delMany([META_PREFIX + id, DATA_PREFIX + id], db));
}

type LegacyStorage = Pick<Storage, "getItem">;

function isLegacyMeta(value: unknown): value is ChatMetadata {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "number"
  );
}

function isLegacyTurn(value: unknown): value is { role: Role; content: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant") &&
    "content" in value &&
    typeof value.content === "string"
  );
}

function parseJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Reads chats saved by older versions, which kept a flat list of messages per
 * chat in localStorage
 */
export function readLegacyChats(storage: LegacyStorage): Chat[] {
  const metas = parseJson(storage.getItem(LEGACY_STORAGE_KEYS.METADATA));
  if (!Array.isArray(metas)) return [];

  return metas.filter(isLegacyMeta).map((legacy) => {
    const turns = parseJson(storage.getItem(LEGACY_STORAGE_KEYS.CONTENT_PREFIX + legacy.id));
    const meta: ChatMetadata = { id: legacy.id, title: legacy.title, updatedAt: legacy.updatedAt };
    if (legacy.isPinned) meta.isPinned = true;
    return {
      meta,
      data: fromTurns(Array.isArray(turns) ? turns.filter(isLegacyTurn) : [], legacy.updatedAt),
    };
  });
}

async function migrateFromLocalStorage(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(LEGACY_STORAGE_KEYS.METADATA);
  if (raw === null) return;

  const chats = readLegacyChats(localStorage);
  const db = getStore();
  // A tab still running the old version can write its copy again after the
  // migration. IndexedDB holds the newer data, so never overwrite a chat.
  const existing = new Set(await keys<string>(db));
  const newChats = chats.filter((chat) => !existing.has(META_PREFIX + chat.meta.id));
  await write(() =>
    setMany(
      newChats.flatMap((chat): [string, unknown][] => [
        [META_PREFIX + chat.meta.id, chat.meta],
        [DATA_PREFIX + chat.meta.id, chat.data],
      ]),
      db,
    ),
  );

  // Only remove the old copies once the new ones are safely written.
  for (const chat of chats)
    localStorage.removeItem(LEGACY_STORAGE_KEYS.CONTENT_PREFIX + chat.meta.id);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.METADATA);
}
