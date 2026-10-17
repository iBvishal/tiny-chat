/**
 * Helpers for the message tree
 * Every message points at its parent. A chat shows one branch at a time: the
 * path from the first message down to `leafId`.
 */

import type { ChatData, Message, Role } from "./types";

/**
 * Random ID that works in insecure contexts too, unlike crypto.randomUUID
 */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createMessage(
  role: Role,
  content: string,
  parentId: string | null,
  extra: Partial<Omit<Message, "id" | "role" | "content" | "parentId">> = {},
): Message {
  return { id: newId(), parentId, role, content, createdAt: Date.now(), ...extra };
}

/**
 * The branch on screen: messages from the first one down to `leafId`
 */
export function getThread(messages: readonly Message[], leafId: string | null): Message[] {
  const byId = new Map(messages.map((message) => [message.id, message]));
  const thread: Message[] = [];
  const seen = new Set<string>();
  let current = leafId ? byId.get(leafId) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    thread.push(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return thread.toReversed();
}

/**
 * Messages that share a parent with `message`, oldest first, including itself
 */
export function getSiblings(messages: readonly Message[], message: Message): Message[] {
  return messages.filter((other) => other.parentId === message.parentId);
}

/**
 * Follows the newest child down from `id` to the end of that branch
 */
export function latestLeaf(messages: readonly Message[], id: string): string {
  const seen = new Set<string>();
  let leaf = id;
  while (!seen.has(leaf)) {
    seen.add(leaf);
    const children = messages.filter((message) => message.parentId === leaf);
    if (children.length === 0) break;
    leaf = children[children.length - 1].id;
  }
  return leaf;
}

/**
 * Builds a single-branch tree from a flat list of turns
 */
export function fromTurns(turns: { role: Role; content: string }[], createdAt: number): ChatData {
  const messages: Message[] = [];
  let parentId: string | null = null;
  for (const [index, turn] of turns.entries()) {
    const message: Message = {
      id: newId(),
      parentId,
      role: turn.role,
      content: turn.content,
      createdAt: createdAt + index,
    };
    messages.push(message);
    parentId = message.id;
  }
  return { messages, leafId: parentId };
}
