"use client"

export type Message = {
    role: "user" | "assistant"
    content: string
}

export type ChatSession = {
    id: string
    title: string
    messages: Message[]
    updatedAt: number
}

const STORAGE_KEY = "tiny_chat_history"

export const getChats = (): ChatSession[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    try {
        return JSON.parse(stored)
    } catch (e) {
        return []
    }
}

export const saveChat = (chat: ChatSession) => {
    const chats = getChats()
    const index = chats.findIndex(c => c.id === chat.id)

    if (index >= 0) {
        chats[index] = { ...chat, updatedAt: Date.now() }
    } else {
        // If it's a new chat, add it to the beginning
        chats.unshift({ ...chat, updatedAt: Date.now() })
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    // Dispatch a custom event to notify other components (like Sidebar)
    window.dispatchEvent(new Event("chats_updated"))
}

export const deleteChat = (id: string) => {
    const chats = getChats().filter(c => c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    window.dispatchEvent(new Event("chats_updated"))
}

export const generateId = () => Math.random().toString(36).substring(2, 11)
