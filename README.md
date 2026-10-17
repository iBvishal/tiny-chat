# Tiny Chat

Tiny Chat is a lightweight, local-first artificial intelligence interface designed for speed and privacy. It utilizes the Gemini API to provide high-quality responses within a refined, responsive user interface.

## Key Features

- **Local Persistence**: All chat history is stored locally in your browser using localStorage. Metadata and message content are managed separately to ensure the interface remains fast even with many stored conversations.
- **Streaming Responses**: Real-time text generation with optimized animation orchestration to ensure a smooth reading experience.
- **Mobile Optimization**: A fully responsive design including a slide-out sidebar for history management. On mobile devices, the sidebar automatically collapses upon selecting a conversation or starting a new one to prioritize the workspace.
- **Message Management**: Support for pinning, renaming, deleting, and exporting conversations. Users can also edit previous messages to branch the conversation or re-generate assistant responses.
- **Temporary Sessions**: An incognito-style mode where conversations are kept in memory and never written to local storage.
- **Rich Markdown Support**: Full rendering for GitHub Flavored Markdown, including tables, code blocks with syntax highlighting, and text-to-speech capabilities.

## Technical Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn UI
- **AI Integration**: Google Gemini SDK (@google/generative-ai)
- **Storage**: Browser localStorage API

## Getting Started

### Prerequisites

You will need a Gemini API key. You can obtain one from the [Google AI Studio](https://aistudio.google.com/).

### Installation

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your API key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Privacy and Storage

Tiny Chat is built with a private-by-default philosophy. Since there is no backend database, your conversations never leave your device except to be processed by the Gemini API. You can clear all data at any time by clearing your browser's local storage for the site.

## Future Roadmap

The following features and optimizations are planned for future releases:

- **Multimodal Capabilities**: Integration of Gemini's vision features to support image and file uploads.
- **Voice Interaction**: Native speech-to-text support for hands-free prompting.
- **Enhanced Organization**: Support for categorizing conversations into folders and workspace-level tagging.
- **Cloud Synchronization**: Optional encrypted sync using services like Supabase or Firebase for cross-device history.
- **Full-Text Search**: Advanced indexing to allow searching through the entire contents of stored message histories.
- **CI/CD and Quality Assurance**: Implementation of automated unit testing, linting, and GitHub Actions workflows for pull request verification.
- **Plug-and-Play Local Models**: Support for running open-source models directly in the browser using WebGPU or connecting to local providers like Ollama.
- **Progressive Web App (PWA)**: Support for offline access and the ability to install Tiny Chat as a native-feeling application on desktop and mobile.
