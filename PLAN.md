# Tiny Chat Implementation Plan

This document tracks the progress of the **tiny-chat** application, a lightweight, client-only chat interface powered by the Gemini API.

## ✅ Phase 1: Project Setup & UI Foundation
- [x] Initialized Next.js project with Tailwind CSS 4.
- [x] Integrated Shadcn UI components (Sidebar, Button, Tooltip).
- [x] Refined Sidebar logic:
    - [x] Remove "Recent" text when collapsed.
    - [x] Always show brand icon (or search/menu) when collapsed.
    - [x] Show expand icon on hover when collapsed.
- [x] Implemented Gemini-style minimal UI (AppSidebar & Page Layout).
- [x] Added hover states and tooltips (200ms delay) to all interactive elements.
- [x] Cleaned up unused components and dependencies for a lightweight codebase.

## ✅ Phase 2: Gemini API Integration
- [x] Generate Gemini API key from Google AI Studio.
- [x] Configure environment variables (`.env.local`).
- [x] Implement Gemini API client logic:
    - [x] Create a reusable fetch function for Gemini.
    - [x] Handle prompt submission and model responses.
    - [x] Add loading states and disabled inputs during generation.

## ✅ Phase 3: Conversation & State Management
- [x] Implement React state for message history (`{ role, content }`).
- [x] Ensure context-aware conversations by sending history to the API.
- [x] Implement browser-based persistence (`localStorage`):
    - [x] Save/Load chat sessions.
    - [x] Unique IDs for multiple conversations.

## ✅ Phase 4: UI/UX Enhancements
- [x] Implement **Streaming Responses** for the "real-time typing" effect.
- [x] Add **Markdown Rendering** for Gemini responses (using `react-markdown`).
- [x] Populate the Sidebar with **Recent Chats** (dynamically loaded from localStorage).
- [x] Add the ability to start a "New Chat" and switch between sessions.

## ✅ Phase 5: Polish & Error Handling
- [x] Handle API rate limits and connection errors gracefully with UI feedback.
- [x] Optimize prompts (System instructions) for the best "tiny-chat" experience.
- [x] Add "Temporary Chat" mode (session-only, no persistence).

---

### Procedural Checklist (Reference)
1. **Gemini API Integration**: Secure key storage + reusable fetch function.
2. **Core Chat UI**: Interactive input + message area + loading states.
3. **State Management**: Array-based history + context consideration.
4. **Sidebar History**: Dynamic listing of past sessions.
5. **Persistence**: `localStorage` integration for session continuity.
