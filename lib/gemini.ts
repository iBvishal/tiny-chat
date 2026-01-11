import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Available models for chat
export const AVAILABLE_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", category: "Fast & Efficient" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", category: "Ultra Fast" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", category: "Balanced" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", category: "Advanced" },
] as const;

export const DEFAULT_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are Tiny Chat, a minimal and helpful AI assistant. 
Your responses should be concise, accurate, and formatted using clean Markdown. 
If asked about your identity, you are Tiny Chat, built as a lightweight client-side application using the Gemini API.
Always prefer brevity and clarity.`;

if (!apiKey) {
    console.warn("Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiResponse = async (prompt: string, history: any[] = [], modelName: string = DEFAULT_MODEL) => {
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
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

export const streamGeminiResponse = async (prompt: string, history: any[] = [], onChunk: (chunk: string) => void, modelName: string = DEFAULT_MODEL) => {
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
