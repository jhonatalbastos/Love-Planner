
import Groq from "groq-sdk";

export interface AIConfig {
    groqKey: string;
}

export const generateAIResponse = async (
    message: string,
    systemInstruction: string,
    config: AIConfig,
    history: { role: 'user' | 'model', text: string }[] = []
): Promise<string> => {

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
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });
        return completion.choices[0]?.message?.content || "Sem resposta da IA.";
    } catch (e: any) {
        console.error("Groq Error:", e);
        throw new Error(`Erro no Groq: ${e.message}`);
    }
};
