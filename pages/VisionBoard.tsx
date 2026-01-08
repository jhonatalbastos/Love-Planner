import React, { useState } from 'react';
import { Screen } from '../types';
import { useInteractiveStore } from '../stores/useInteractiveStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface VisionBoardProps {
    onNavigate: (screen: Screen) => void;
}

export const VisionBoard: React.FC<VisionBoardProps> = ({ onNavigate }) => {
    const visions = useInteractiveStore(state => state.visions);
    const addVision = useInteractiveStore(state => state.addVision);
    const deleteVision = useInteractiveStore(state => state.deleteVision);
    const user = useAuthStore(state => state.user);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAdd = async () => {
        if (!newImageUrl.trim()) return alert("Adicione uma imagem!");
        if (user) {
            await addVision({
                id: crypto.randomUUID(),
                created_by: user.id,
                image_url: newImageUrl,
                caption: newCaption,
                created_at: new Date().toISOString()
            });
        }
        setShowAddModal(false);
        setNewImageUrl('');
        setNewCaption('');
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
                    {/* Image Preview Area */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-text-muted uppercase">Imagem</label>

                        {newImageUrl ? (
                            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border-light dark:border-border-dark group">
                                <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setNewImageUrl('')}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="material-symbols-rounded text-sm">close</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleUploadClick}
                                    className="flex-1 h-32 flex flex-col gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5"
                                >
                                    <span className="material-symbols-rounded text-3xl text-primary">add_photo_alternate</span>
                                    <span className="text-xs">Carregar do Celular</span>
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        )}

                        {!newImageUrl && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-card-dark px-2 text-text-muted">Ou cole o link</span>
                                </div>
                            </div>
                        )}

                        {!newImageUrl && (
                            <Input
                                value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="text-xs"
                            />
                        )}
                    </div>

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
