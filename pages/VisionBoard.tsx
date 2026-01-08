import React, { useState } from 'react';
import { Screen } from '../types';
import { useApp } from '../contexts/AppContext';

interface VisionBoardProps {
    onNavigate: (screen: Screen) => void;
}

export const VisionBoard: React.FC<VisionBoardProps> = ({ onNavigate }) => {
    const { visions, addVision, deleteVision } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newCaption, setNewCaption] = useState('');

    const handleAdd = async () => {
        if (!newImageUrl.trim()) return alert("Cole o link da imagem!");
        await addVision(newImageUrl, newCaption);
        setShowAddModal(false);
        setNewImageUrl('');
        setNewCaption('');
    };

    const handleUpload = () => {
        // Simulate upload: In real app, upload to storage and get URL.
        // Here we can ask user to paste a link (pinterest/unsplash)
        // OR use a file reader to base64 (limited size, but works for prototype)
        alert("Por enquanto, cole o link de uma imagem da internet! (Ex: Pinterest)");
    }

    const handleDelete = async (id: string) => {
        if (confirm("Remover do mural?")) {
            await deleteVision(id);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
            <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => onNavigate(Screen.Dashboard)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-rounded">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Mural dos Sonhos</h1>
            </header>

            <main className="flex-1 p-3 overflow-y-auto">
                {visions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-60">
                        <span className="material-symbols-rounded text-6xl text-primary mb-4">auto_awesome</span>
                        <p className="text-lg font-bold">Seu mural está vazio!</p>
                        <p className="text-sm">Adicione fotos de sonhos, viagens e metas.</p>
                    </div>
                ) : (
                    <div className="columns-2 gap-3 space-y-3">
                        {visions.map(v => (
                            <div key={v.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-black">
                                <img src={v.image_url} alt={v.caption} className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    {v.caption && <p className="text-white text-xs font-bold mb-1">{v.caption}</p>}
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="self-end p-2 bg-white/20 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FAB */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 size-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform z-50"
            >
                <span className="material-symbols-rounded text-2xl">add</span>
            </button>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-[fadeIn_0.2s]">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 animate-[scaleIn_0.3s]">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Adicionar Sonho</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <input
                            value={newImageUrl}
                            onChange={e => setNewImageUrl(e.target.value)}
                            placeholder="Cole o Link da Imagem (URL)..."
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 outline-none border border-transparent focus:border-primary"
                        />
                        <p className="text-xs text-text-muted text-center" onClick={handleUpload}>
                            Dica: Copie o endereço da imagem do Google/Pinterest.
                        </p>

                        <input
                            value={newCaption}
                            onChange={e => setNewCaption(e.target.value)}
                            placeholder="Legenda (Opcional)"
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 outline-none"
                        />

                        <button
                            onClick={handleAdd}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30"
                        >
                            Adicionar ao Mural
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
