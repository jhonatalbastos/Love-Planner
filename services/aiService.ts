import { supabase } from '../lib/supabase';
import { GOAL_SUGGESTIONS, AGREEMENT_SUGGESTIONS } from '../data/suggestions';

// Define expected response structure for consistency (though LLM output is text)
interface AIRequest {
    type: 'goal' | 'agreement' | 'date_idea';
    context?: string;
    count?: number;
}

export const aiService = {
    // Check if AI is configured
    async isConfigured(): Promise<boolean> {
        // Check local storage for key (as per AppContext preference logic)
        // Ideally, we might pass the key in, but for simplicity let's assume we can grab it 
        // or user passes it. For security, keys should be backend, but this is a local-first/client-key app.
        return true;
    },

    async generateSuggestions(type: 'goal' | 'agreement', apiKey: string, existingItems: string[] = []): Promise<any[]> {
        if (!apiKey) return [];

        const promptBase = type === 'goal'
            ? `Gere 3 sugestões de metas de casal criativas e práticas. Não repita: ${existingItems.join(', ')}. Responda APENAS com um array JSON válido neste formato: [{"title": "título", "target": numero, "period": "weekly"|"monthly", "type": "bonding"|"growth"|"financial"|"health", "icon": "material_symbol_name"}]`
            : `Gere 3 sugestões de acordos de relacionamento saudáveis. Não repita: ${existingItems.join(', ')}. Responda APENAS com um array JSON válido neste formato: [{"title": "título", "details": "explicação curta", "tag": "categoria", "timeInfo": "frequencia"}]`;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama3-70b-8192", // Fast and good for JSON
                    messages: [
                        { role: "system", content: "You are a helpful relationship coach assistant. You output only valid JSON." },
                        { role: "user", content: promptBase }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('AI Request failed');

            const data = await response.json();
            const content = data.choices[0]?.message?.content;

            // Parse JSON from content (handle potential markdown wrapping)
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);

        } catch (error) {
            console.error("AI Generation Error:", error);
            return [];
        }
    }
};
