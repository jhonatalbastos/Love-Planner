import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export interface AIConfig {
    provider: 'gemini' | 'groq';
    geminiKey: string;
    groqKey: string;
}

export const generateAIResponse = async (
    message: string,
    systemInstruction: string,
    config: AIConfig,
    history: { role: 'user' | 'model', text: string }[] = [] // Simplified history for internal use
): Promise<string> => {

    if (config.provider === 'groq') {
        if (!config.groqKey) throw new Error("Chave da API Groq não configurada.");

        const groq = new Groq({
            apiKey: config.groqKey,
            dangerouslyAllowBrowser: true
        });

        // Convert history to Groq format
        const groqMessages: any[] = [
            { role: 'system', content: systemInstruction },
            ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
            { role: 'user', content: message }
        ];

        try {
            const completion = await groq.chat.completions.create({
                messages: groqMessages,
                model: "llama-3.3-70b-versatile", // Using a good default model
                temperature: 0.7,
            });
            return completion.choices[0]?.message?.content || "Sem resposta da IA.";
        } catch (e: any) {
            console.error("Groq Error:", e);
            throw new Error(`Erro no Groq: ${e.message}`);
        }

    } else {
        // Default to Gemini
        const apiKey = config.geminiKey || process.env.GEMINI_API_KEY || process.env.API_KEY; // Fallback to env if available
        if (!apiKey) throw new Error("Chave da API Google (Gemini) não configurada.");

        try {
            const googleAI = new GoogleGenAI({ apiKey });

            // Map history to Gemini format if needed, but the simple sendMessage approach usually handles conversation state 
            // if we are using a persistent chat session. However, this function is stateless.
            // For a stateless one-shot request with history, it's a bit complex in Gemini SDK unless we recreate the chat.

            // Re-creating chat context
            const chatHistory = history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }));

            const chat = googleAI.chats.create({
                model: 'gemini-2.0-flash', // Using latest available
                config: { systemInstruction },
                history: chatHistory
            });

            const result = await chat.sendMessage({ message });
            return result.text || "Sem resposta.";
        } catch (e: any) {
            console.error("Gemini Error:", e);
            throw new Error(`Erro no Gemini: ${e.message}`);
        }
    }
};
