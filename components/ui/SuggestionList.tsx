import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { useAuthStore } from '../../stores/useAuthStore';
import { aiService } from '../../services/aiService';
import { Loading } from './Loading';

interface SuggestionListProps {
    type: 'goal' | 'agreement';
    staticSuggestions: any[];
    onSelect: (item: any) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({ type, staticSuggestions, onSelect }) => {
    const preferences = useAuthStore(state => state.preferences);
    const [generatedItems, setGeneratedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!preferences.aiConfig?.groqKey) {
            setError('Configure a chave de IA nos Ajustes para gerar novas ideias!');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const existingTitles = [...staticSuggestions, ...generatedItems].map(i => i.title);
            const newItems = await aiService.generateSuggestions(type, preferences.aiConfig.groqKey, existingTitles);
            if (newItems && newItems.length > 0) {
                setGeneratedItems(prev => [...newItems, ...prev]);
            } else {
                setError('Não foi possível gerar sugestões agora.');
            }
        } catch (e) {
            setError('Erro ao conectar com a IA.');
        } finally {
            setLoading(false);
        }
    };

    const displayList = [...generatedItems, ...staticSuggestions];

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-text-muted uppercase">Sugestões Rápidas</h4>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-primary text-xs"
                >
                    {loading ? 'Gerando...' : '✨ Gerar com IA'}
                </Button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {loading && <Loading className="py-4" />}

            <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 snap-x hide-scrollbar">
                {displayList.map((item, index) => (
                    <Card
                        key={`${item.title}-${index}`}
                        onClick={() => onSelect(item)}
                        className="min-w-[160px] w-[160px] flex-shrink-0 p-3 flex flex-col gap-2 cursor-pointer border hover:border-primary snap-center transition-all hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95"
                    >
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-rounded text-lg">
                                {item.icon || (type === 'agreement' ? 'handshake' : 'flag')}
                            </span>
                        </div>
                        <div>
                            <p className="font-bold text-xs line-clamp-2 leading-tight">{item.title}</p>
                            <p className="text-[10px] text-text-muted mt-1 line-clamp-2">
                                {item.details || `${item.target}x por ${item.period === 'weekly' ? 'sem' : 'mês'}`}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
