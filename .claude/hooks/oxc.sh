#!/usr/bin/env bash
# PostToolUse hook: formats the file Claude just edited with oxfmt, then lints it
# with oxlint. Lint errors go back to Claude (exit 2) so it fixes them right away.

file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
bin="$CLAUDE_PROJECT_DIR/node_modules/.bin"

[ -f "$file" ] || exit 0
[ -x "$bin/oxfmt" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.jsonc | *.css | *.md) ;;
  *) exit 0 ;;
esac

"$bin/oxfmt" --no-error-on-unmatched-pattern "$file" > /dev/null 2>&1

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs) ;;
  *) exit 0 ;;
esac

if ! out=$("$bin/oxlint" --quiet -f agent "$file" 2>&1); then
  echo "$out" >&2
  exit 2
fi
