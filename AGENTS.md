# AGENTS.md

Guidance for coding agents working on tiny-chat.

## Commands

- `npm ci`: install
- `npm run dev`: dev server on http://localhost:3000. Needs `GEMINI_API_KEY` in `.env.local`.
- `npm run check`: format check, lint and type check. Run it before every commit; CI runs the same.
- `npm test`: unit tests (vitest) for `lib/`
- `npm run format`: format everything with oxfmt
- `npm run lint:fix`: apply oxlint's safe fixes
- `npm run build`: production build

## Formatting and linting

- oxfmt formats and oxlint lints. Do not add ESLint, Prettier or Biome.
- Config lives in `.oxfmtrc.json` and `.oxlintrc.json`. oxfmt also sorts imports and Tailwind classes. oxlint runs type-aware rules through `oxlint-tsgolint`.
- In Claude Code, `.claude/hooks/oxc.sh` formats and lints every file you edit. Fix the lint errors it reports before moving on.
- A few rules are warnings only because existing code breaks them. They are listed at the end of `.oxlintrc.json`. Do not add new violations, and set a rule back to `error` once its last violation is fixed.
- Do not silence a rule with a disable comment unless the same line says why.
- Formatting-only commits go in `.git-blame-ignore-revs`.

## Ground rules

- Chats live in the browser's IndexedDB through `lib/storage.ts`; temporary chats never touch storage. The only server code is `app/api/chat/route.ts`.
- Messages form a tree (`parentId`); a chat shows the branch ending at `leafId`. Edits and regenerated replies add siblings instead of replacing messages. Helpers are in `lib/chat-tree.ts`.
- `lib/gemini.ts` is the only code that talks to Gemini. It uses the REST API with `fetch` so it runs in the browser and on the server; do not add a Gemini SDK.
- The site's key is `GEMINI_API_KEY` and stays on the server: `/api/chat` adds it and only allows models with `sharedKey: true`. The model list and system prompt are in `lib/constants.ts`.
- Anything named `NEXT_PUBLIC_*` ships to the browser. Never put a secret there.
- `components/ui/` holds shadcn/ui components. Add new ones with the shadcn CLI rather than by hand.
- Stack: Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript strict.
- The repository is public. Never commit `.env*` files or API keys.

## Map

| Path                               | What it is                                                           |
| ---------------------------------- | -------------------------------------------------------------------- |
| `components/home-page-content.tsx` | Chat screen layout, composer and message list                        |
| `hooks/use-chat.ts`                | Chat state: load, send, stream, edit, regenerate, retry, save        |
| `components/app-sidebar.tsx`       | History, search (Cmd+K), new chat (Cmd+Shift+O), rename, pin, delete |
| `components/chat/`                 | Message bubbles, Markdown rendering, response actions                |
| `components/typewriter/`           | Title and "thinking" animations                                      |
| `app/api/chat/route.ts`            | Streams Gemini replies with the site's shared key                    |
| `lib/`                             | Gemini client, storage, constants, types, error messages             |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
