"use client"

import type { Message, ChatMetadata } from "./types"
import { STORAGE_KEYS } from "./constants"

const METADATA_KEY = STORAGE_KEYS.METADATA
const CONTENT_PREFIX = STORAGE_KEYS.CONTENT_PREFIX


/**
 * Retrieves the list of all chat sessions (metadata only).
 * Sorted by pinned status and then by recency.
 * @returns {ChatMetadata[]} Array of chat metadata
 */
export const getChatHistory = (): ChatMetadata[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(METADATA_KEY)
    if (!stored) return []
    try {
        const parsed = JSON.parse(stored) as ChatMetadata[]
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

/**
 * Retrieves the message content for a specific chat ID.
 * @param {string} id - The chat session ID
 * @returns {Message[]} Array of messages
 */
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

/**
 * Saves or updates a chat session (both metadata and messages).
 * @param {string} id - The chat ID
 * @param {string} title - The chat title
 * @param {Message[]} messages - The message history
 * @param {boolean} [isPinned] - Optional pinned status
 */
export const saveChat = (id: string, title: string, messages: Message[], isPinned?: boolean) => {
    if (typeof window === "undefined") return

    const history = getChatHistory()
    const existingIndex = history.findIndex(h => h.id === id)
    const updatedAt = Date.now()

    const metadata: ChatMetadata = {
        id,
        title,
        updatedAt,
        isPinned: existingIndex >= 0 ? history[existingIndex].isPinned : isPinned
    }

    if (existingIndex >= 0) {
        history[existingIndex] = metadata
    } else {
        history.unshift(metadata)
    }

    localStorage.setItem(METADATA_KEY, JSON.stringify(history))
    localStorage.setItem(`${CONTENT_PREFIX}${id}`, JSON.stringify(messages))
}

/**
 * Deletes a chat session and its associated messages.
 * @param {string} id - The chat ID to delete
 */
export const deleteChat = (id: string) => {
    if (typeof window === "undefined") return
    const history = getChatHistory().filter(h => h.id !== id)
    localStorage.setItem(METADATA_KEY, JSON.stringify(history))
    localStorage.removeItem(`${CONTENT_PREFIX}${id}`)
}

/**
 * Updates only the metadata (e.g., pinning, renaming) of a chat session.
 * @param {string} id - The chat ID
 * @param {Partial<ChatMetadata>} updates - The fields to update
 */
export const updateChatMetadata = (id: string, updates: Partial<ChatMetadata>) => {
    if (typeof window === "undefined") return
    const history = getChatHistory()
    const index = history.findIndex(h => h.id === id)
    if (index >= 0) {
        history[index] = { ...history[index], ...updates, updatedAt: Date.now() }
        localStorage.setItem(METADATA_KEY, JSON.stringify(history))
    }
}

/**
 * Generates a unique ID for a new chat session.
 * @returns {string} A random 9-character alphanumeric ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 11)
