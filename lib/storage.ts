"use client"

export type Message = {
    role: "user" | "assistant"
    content: string
}

export type ChatMetadata = {
    id: string
    title: string
    updatedAt: number
}

export type ChatSession = ChatMetadata & {
    messages: Message[]
}

const METADATA_KEY = "tiny_chat_sessions"
const CONTENT_PREFIX = "tiny_chat_content_"

// Get just the lightweight list for the sidebar
export const getChatHistory = (): ChatMetadata[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(METADATA_KEY)
    if (!stored) return []
    try {
        return JSON.parse(stored)
    } catch (e) {
        return []
    }
}

// Get full messages for a specific chat only when needed
export const getChatMessages = (id: string): Message[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(`${CONTENT_PREFIX}${id}`)
    if (!stored) return []
    try {
        return JSON.parse(stored)
    } catch (e) {
        return []
    }
}

export const saveChat = (chat: ChatSession) => {
    if (typeof window === "undefined") return

    // 1. Update Metadata List (Lightweight)
    const history = getChatHistory()
    const index = history.findIndex(c => c.id === chat.id)

    const metadata: ChatMetadata = {
        id: chat.id,
        title: chat.title,
        updatedAt: Date.now()
    }

    if (index >= 0) {
        history[index] = metadata
    } else {
        history.unshift(metadata)
    }

    localStorage.setItem(METADATA_KEY, JSON.stringify(history))

    // 2. Update Content (Heavier, stored separately)
    localStorage.setItem(`${CONTENT_PREFIX}${chat.id}`, JSON.stringify(chat.messages))

    // Notify listeners
    window.dispatchEvent(new Event("chats_updated"))
}

export const deleteChat = (id: string) => {
    if (typeof window === "undefined") return

    const history = getChatHistory().filter(c => c.id !== id)
    localStorage.setItem(METADATA_KEY, JSON.stringify(history))
    localStorage.removeItem(`${CONTENT_PREFIX}${id}`)

    window.dispatchEvent(new Event("chats_updated"))
}

export const generateId = () => Math.random().toString(36).substring(2, 11)
