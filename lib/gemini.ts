import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// Centralized model name for easy management
const GEMINI_MODEL = "gemini-3-flash-preview";

if (!apiKey) {
    console.warn("Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiResponse = async (prompt: string, history: any[] = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        // Convert our internal message format to Gemini's format
        // Internal: { role: "user" | "assistant", content: string }
        // Gemini: { role: "user" | "model", parts: [{ text: string }] }
        const geminiHistory = history.map(msg => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: geminiHistory,
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

// For streaming responses (Phase 4)
export const streamGeminiResponse = async (prompt: string, history: any[] = [], onChunk: (chunk: string) => void) => {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const geminiHistory = history.map(msg => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: geminiHistory,
        });

        const result = await chat.sendMessageStream(prompt);
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            onChunk(chunkText);
        }
    } catch (error) {
        console.error("Error streaming from Gemini API:", error);
        throw error;
    }
};
