/**
 * Turns Markdown into plain text for speech synthesis
 * Formatting marks are dropped, links read as their text, and code blocks are
 * replaced with a short note, since reading code aloud is rarely useful.
 */
export function markdownToSpeech(markdown: string): string {
  return (
    markdown
      // Fenced code blocks, including one still open at the end
      .replace(/```[\s\S]*?(?:```|$)/g, "\n(Code block.)\n")
      .replace(/`([^`\n]+)`/g, "$1")
      // Images read as their alt text, links as their text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      // Line markers: headings, quotes, list bullets and numbers, rules.
      // [ \t] rather than \s, so blank lines between blocks survive.
      .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
      .replace(/^[ \t]{0,3}>[ \t]?/gm, "")
      .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, "")
      .replace(/^[ \t]*[-*+][ \t]+(?:\[[ xX]\][ \t]+)?/gm, "")
      .replace(/^[ \t]*\d+[.)][ \t]+/gm, "")
      // Tables: drop separator rows, read cells as a list
      .replace(/^[ \t]*\|?(?:[ \t]*:?-+:?[ \t]*\|)+(?:[ \t]*:?-+:?[ \t]*)?$/gm, "")
      .replace(/^[ \t]*\|(.*)\|[ \t]*$/gm, "$1")
      .replace(/[ \t]*\|[ \t]*/g, ", ")
      // Emphasis. Underscores only count at word edges, so snake_case survives.
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/\*(?!\s)(.+?)\*/g, "$1")
      .replace(/(^|\W)_(?!\s)(.+?)_(?=\W|$)/g, "$1$2")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/[ \t]+/g, " ")
      .replace(/^ | $/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
