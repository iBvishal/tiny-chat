import type { Message } from "./types";

/**
 * Saves the branch on screen as a text file
 */
export function downloadChat(title: string, thread: readonly Message[]) {
  if (thread.length === 0) return;

  const text = thread
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}\n\n---\n\n`)
    .join("");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  link.download = `tiny-chat-${title || "export"}-${timestamp}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
