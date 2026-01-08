import React, { useState } from 'react';
import { Input } from './Input';

interface AIKeyInputProps {
    value: string;
    onChange: (val: string) => void;
}

export const AIKeyInput: React.FC<AIKeyInputProps> = ({ value, onChange }) => {
    const [showKey, setShowKey] = useState(false);

    const handleDelete = () => {
        if (window.confirm("Tem certeza que deseja remover a chave API salva?")) {
            onChange('');
        }
    };

    return (
        <div className="relative">
            <Input
                type={showKey ? 'text' : 'password'}
                label="Chave API da Groq"
                placeholder="Cole sua chave Groq aqui..."
                value={value}
                onChange={e => onChange(e.target.value)}
                className="font-mono pr-20" // Space for buttons
                containerClassName="relative"
            />

            <div className="absolute right-2 top-[34px] flex items-center gap-1 z-10">
                {value && (
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remover Chave"
                    >
                        <span className="material-symbols-rounded text-[18px]">delete</span>
                    </button>
                )}

                <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                    title={showKey ? "Ocultar" : "Revelar"}
                >
                    <span className="material-symbols-rounded text-[18px]">
                        {showKey ? 'visibility_off' : 'visibility'}
                    </span>
                </button>
            </div>
        </div>
    );
};
