import React, { useState } from 'react';
import { Screen } from '../types';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

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
                <Button variant="ghost" size="icon" onClick={() => onNavigate(Screen.Dashboard)}>
                    <span className="material-symbols-rounded">arrow_back</span>
                </Button>
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
                                    <Button
                                        variant="danger"
                                        size="icon"
                                        onClick={() => handleDelete(v.id)}
                                        className="self-end !bg-white/20 hover:!bg-red-500 !text-white backdrop-blur-sm"
                                    >
                                        <span className="material-symbols-rounded text-sm">delete</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FAB */}
            <Button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 !size-14 !rounded-full shadow-xl shadow-primary/30 z-50"
            >
                <span className="material-symbols-rounded text-2xl">add</span>
            </Button>

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Adicionar Sonho"
                footer={
                    <Button onClick={handleAdd} className="w-full shadow-lg shadow-primary/30">
                        Adicionar ao Mural
                    </Button>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Link da Imagem"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                        placeholder="Cole o URL..."
                    />
                    <p className="text-xs text-text-muted text-center cursor-pointer hover:underline" onClick={handleUpload}>
                        Dica: Copie o endereço da imagem do Google/Pinterest.
                    </p>

                    <Input
                        label="Legenda"
                        value={newCaption}
                        onChange={e => setNewCaption(e.target.value)}
                        placeholder="Ex: Nossa casa nova"
                    />
                </div>
            </Modal>
        </div>
    );
};
