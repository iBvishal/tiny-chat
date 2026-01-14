"use client"

export type Message = {
    role: "user" | "assistant"
    content: string
}

export type ChatMetadata = {
    id: string
    title: string
    updatedAt: number
    isPinned?: boolean
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
        const parsed = JSON.parse(stored) as ChatMetadata[]
        // Sort: Pinned first, then by Recency (newest first)
        return parsed.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return b.updatedAt - a.updatedAt
        })
    } catch (error) {
        console.error("Failed to parse chat history:", error)
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
    } catch (error) {
        console.error("Failed to parse chat messages:", error)
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

export const updateChatMetadata = (id: string, updates: Partial<ChatMetadata>) => {
    if (typeof window === "undefined") return

    const history = getChatHistory()
    const index = history.findIndex(c => c.id === id)

    if (index >= 0) {
        history[index] = { ...history[index], ...updates }
        localStorage.setItem(METADATA_KEY, JSON.stringify(history))
        window.dispatchEvent(new Event("chats_updated"))
    }
}

export const generateId = () => Math.random().toString(36).substring(2, 11)
