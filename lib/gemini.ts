import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message } from "@/lib/types";
import { DEFAULT_MODEL, SYSTEM_PROMPT } from "./constants";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiResponse = async (prompt: string, history: Message[] = [], modelName: string = DEFAULT_MODEL) => {
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT
        });

        const geminiHistory = history.map(msg => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: geminiHistory,
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

export const streamGeminiResponse = async (prompt: string, history: Message[] = [], onChunk: (chunk: string) => void, modelName: string = DEFAULT_MODEL) => {
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT
        });

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
