import React, { useState, useMemo } from 'react';
import { Screen, LogEntry } from '../types';
import { useApp } from '../contexts/AppContext';

interface GalleryProps {
    onNavigate: (screen: Screen) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onNavigate }) => {
    const { logs, addLog } = useApp();
    const [selectedPhoto, setSelectedPhoto] = useState<LogEntry | null>(null);
    const [filterYear, setFilterYear] = useState<string>('all');

    // --- Helpers ---
    const getYear = (dateStr: string) => dateStr.split('-')[0];

    // Format Date for Display
    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // --- Flashback Logic ---
    const flashbacks = useMemo(() => {
        const today = new Date();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currentDay = String(today.getDate()).padStart(2, '0');
        const todayMatcher = `-${currentMonth}-${currentDay}`; // Matches "-MM-DD"

        return logs.filter(log =>
            log.photo &&
            log.date.endsWith(todayMatcher) &&
            getYear(log.date) !== String(today.getFullYear()) // Not from today
        );
    }, [logs]);

    // --- Photo List ---
    const allPhotos = useMemo(() => {
        let filtered = logs.filter(log => log.photo && log.photo.trim().length > 0);

        // Sort Newest First
        filtered.sort((a, b) => b.date.localeCompare(a.date));

        if (filterYear !== 'all') {
            filtered = filtered.filter(log => getYear(log.date) === filterYear);
        }
        return filtered;
    }, [logs, filterYear]);

    const availableYears = useMemo(() => {
        const years = new Set(logs.filter(l => l.photo).map(l => getYear(l.date)));
        return Array.from(years).sort().reverse();
    }, [logs]);

    // --- Handlers ---

    const handleDelete = async () => {
        if (!selectedPhoto) return;
        if (confirm("Tem certeza que deseja remover esta foto? O registro diário será mantido, apenas a foto será apagada.")) {
            // Create updated log without photo
            const updatedLog = { ...selectedPhoto, photo: undefined };
            await addLog(updatedLog); // addLog handles update if date exists
            setSelectedPhoto(null);
        }
    };

    const handleEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedPhoto || !e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const updatedLog = { ...selectedPhoto, photo: base64String };
            await addLog(updatedLog);
            setSelectedPhoto(updatedLog); // Update local view
        };
        reader.readAsDataURL(file);
    };

    const handleDownload = () => {
        if (!selectedPhoto?.photo) return;
        const link = document.createElement('a');
        link.href = selectedPhoto.photo;
        link.download = `love_planner_${selectedPhoto.date}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
            <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate(Screen.Dashboard)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold">Galeria de Fotos</h1>
                </div>
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-gray-100 dark:bg-white/10 border-none rounded-lg text-xs py-1 px-2"
                >
                    <option value="all">Todos os anos</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </header>

            <main className="flex-1 p-2">

                {/* Flashbacks Section */}
                {flashbacks.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <span className="material-symbols-rounded text-yellow-500 animate-pulse">wb_sunny</span>
                            <h2 className="font-bold text-sm uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Neste dia...</h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 snap-x px-2">
                            {flashbacks.map(log => (
                                <div
                                    key={log.id}
                                    onClick={() => setSelectedPhoto(log)}
                                    className="flex-shrink-0 w-40 relative group cursor-pointer snap-center"
                                >
                                    <img src={log.photo} className="w-40 h-56 object-cover rounded-xl shadow-md border-2 border-yellow-400 group-hover:scale-[1.02] transition-transform" />
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 rounded-b-xl">
                                        <p className="text-white text-xs font-bold text-center">{getYear(log.date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Photo Grid */}
                {allPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <span className="material-symbols-rounded text-6xl mb-4">Hide_image</span>
                        <p>Nenhuma foto encontrada.</p>
                        <p className="text-xs">Adicione fotos aos seus registros diários!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 pb-20">
                        {allPhotos.map(log => (
                            <div
                                key={log.id}
                                onClick={() => setSelectedPhoto(log)}
                                className="aspect-square relative group cursor-pointer overflow-hidden rounded-md bg-gray-100 dark:bg-white/5"
                            >
                                <img
                                    src={log.photo}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox / Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-[fadeIn_0.2s_ease-out]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 text-white">
                        <button onClick={() => setSelectedPhoto(null)} className="p-2 rounded-full hover:bg-white/10">
                            <span className="material-symbols-rounded">close</span>
                        </button>
                        <span className="font-medium text-sm">{formatDate(selectedPhoto.date)}</span>
                        <div className="flex gap-2">
                            <label className="p-2 rounded-full hover:bg-white/10 cursor-pointer">
                                <span className="material-symbols-rounded">edit</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleEdit} />
                            </label>
                            <button onClick={handleDelete} className="p-2 rounded-full hover:bg-red-500/20 text-red-400">
                                <span className="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                        <img
                            src={selectedPhoto.photo}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>

                    {/* Footer/Details */}
                    <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent text-white pb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-400 material-symbols-rounded text-sm">star</span>
                            <span className="font-bold text-lg">{selectedPhoto.rating}/10</span>
                        </div>
                        {selectedPhoto.summary && (
                            <p className="text-gray-200 text-sm leading-relaxed line-clamp-3">
                                {selectedPhoto.summary}
                            </p>
                        )}
                        <button
                            onClick={handleDownload}
                            className="mt-4 w-full py-3 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-rounded">download</span>
                            Baixar Foto
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
