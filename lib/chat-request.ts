/**
 * Validation for requests to `/api/chat`
 * The route forwards requests to Gemini with the site's key, so it only
 * accepts known models and well-formed turns.
 */

import { ATTACHMENT_MIME_TYPES, MAX_SYSTEM_PROMPT_LENGTH, getModel } from "./constants";
import type { Attachment, ChatRequest, ChatTurn } from "./types";

const MAX_TURNS = 500;
const MAX_ATTACHMENTS_PER_TURN = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAttachment(value: unknown): Attachment | null {
  if (!isRecord(value)) return null;
  const { id, name, mimeType, data, size } = value;
  if (typeof id !== "string" || typeof name !== "string" || typeof data !== "string") return null;
  if (typeof mimeType !== "string" || !ATTACHMENT_MIME_TYPES.includes(mimeType)) return null;
  if (typeof size !== "number") return null;
  return { id, name, mimeType, data, size };
}

function parseTurn(value: unknown): ChatTurn | null {
  if (!isRecord(value)) return null;
  const { role, content, attachments } = value;
  if (role !== "user" && role !== "assistant") return null;
  if (typeof content !== "string") return null;
  if (attachments === undefined) return { role, content };
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS_PER_TURN) return null;

  const parsed: Attachment[] = [];
  for (const item of attachments) {
    const attachment = parseAttachment(item);
    if (!attachment) return null;
    parsed.push(attachment);
  }
  return { role, content, attachments: parsed };
}

/**
 * Returns a clean copy of the request, or null if it's malformed or names an
 * unknown model
 */
export function parseChatRequest(value: unknown): ChatRequest | null {
  if (!isRecord(value)) return null;
  const { model, system, messages, webSearch, thoughts } = value;

  if (typeof model !== "string" || getModel(model).id !== model) return null;
  if (typeof system !== "string" || system.length > MAX_SYSTEM_PROMPT_LENGTH) return null;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_TURNS) return null;
  if (webSearch !== undefined && typeof webSearch !== "boolean") return null;
  if (thoughts !== undefined && typeof thoughts !== "boolean") return null;

  const turns: ChatTurn[] = [];
  for (const message of messages) {
    const turn = parseTurn(message);
    if (!turn) return null;
    turns.push(turn);
  }

  return {
    model,
    system,
    messages: turns,
    webSearch: webSearch === true,
    thoughts: thoughts === true && getModel(model).thinking,
  };
}
