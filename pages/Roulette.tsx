import React, { useState, useRef, useEffect } from 'react';
import { Screen, DecisionList } from '../types';
import { useInteractiveStore } from '../stores/useInteractiveStore';
import { useAuthStore } from '../stores/useAuthStore';

interface RouletteProps {
    onNavigate: (screen: Screen) => void;
}

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFC300', '#DAF7A6', '#581845', '#900C3F', '#C70039', '#FF5733'];

export const Roulette: React.FC<RouletteProps> = ({ onNavigate }) => {
    const decisionLists = useInteractiveStore(state => state.decisionLists);
    const addDecisionList = useInteractiveStore(state => state.addDecisionList);
    const updateDecisionList = useInteractiveStore(state => state.updateDecisionList);
    const deleteDecisionList = useInteractiveStore(state => state.deleteDecisionList);
    const user = useAuthStore(state => state.user);

    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [mode, setMode] = useState<'list' | 'spin' | 'edit'>('list');

    // Edit State
    const [editTitle, setEditTitle] = useState('');
    const [editItems, setEditItems] = useState<string[]>([]);

    // Spin State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    const activeList = decisionLists.find(l => l.id === activeListId);

    // --- Wheel Drawing Logic ---
    useEffect(() => {
        if (mode === 'spin' && activeList && canvasRef.current) {
            drawWheel(0);
        }
    }, [mode, activeList]);

    const drawWheel = (angleOffset: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !activeList) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const items = activeList.items.filter(i => i.trim() !== '');
        const sliceAngle = (2 * Math.PI) / items.length;

        ctx.clearRect(0, 0, width, height);

        items.forEach((item, i) => {
            const startAngle = i * sliceAngle + angleOffset;
            const endAngle = (i + 1) * sliceAngle + angleOffset;

            // Slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(item, radius - 20, 5);
            ctx.restore();
        });

        // Pointer
        ctx.beginPath();
        ctx.moveTo(width - 20, centerY);
        ctx.lineTo(width, centerY - 10);
        ctx.lineTo(width, centerY + 10);
        ctx.fillStyle = 'black';
        ctx.fill();
    };

    const spin = () => {
        if (spinning || !activeList) return;
        setSpinning(true);
        setWinner(null);

        const items = activeList.items.filter(i => i.trim() !== '');
        if (items.length < 2) return alert("Adicione pelo menos 2 opções!");

        // Physics
        let velocity = Math.random() * 0.5 + 0.5; // Initial speed
        let currentAngle = 0;
        let friction = 0.985;

        // Slight random extra rotation to ensure randomness
        const extraConfig = Math.random() * 20;

        const animate = () => {
            velocity *= friction; // Decelerate components
            currentAngle += velocity;

            drawWheel(currentAngle);

            if (velocity > 0.002) {
                requestAnimationFrame(animate);
            } else {
                setSpinning(false);
                // Calculate winner
                // The pointer is at 0 radians (right side) in my draw logic, 
                // but actually standard draw starts at 0 (right).
                // Let's normalize angle
                const normalizedAngle = currentAngle % (2 * Math.PI);
                // Pointer is at 0 (Right).
                // The slice that intersects 0 is the winner.
                // Since we draw clockwise, high angle puts end items at 0?
                // Actually simpler: 
                // total rotation % 2PI. 
                // The slice index is: floor((2PI - normalizedAngle) / sliceAngle) % count

                const sliceAngle = (2 * Math.PI) / items.length;
                const winningIndex = Math.floor(((2 * Math.PI) - normalizedAngle) / sliceAngle) % items.length;

                setWinner(items[winningIndex]);
            }
        };
        animate();
    };

    // --- Handlers ---
    const startCreate = () => {
        setEditTitle('');
        setEditItems(['', '']);
        setActiveListId(null);
        setMode('edit');
    };

    const startEdit = (list: DecisionList) => {
        setActiveListId(list.id);
        setEditTitle(list.title);
        setEditItems(list.items);
        setMode('edit');
    };

    const saveList = async () => {
        const validItems = editItems.filter(i => i.trim());
        if (!editTitle.trim() || validItems.length < 2) return alert("Título e min 2 opções!");

        if (activeListId) {
            await updateDecisionList(activeListId, validItems);
        } else {
            if (user) {
                await addDecisionList({
                    id: crypto.randomUUID(),
                    created_by: user.id,
                    title: editTitle,
                    items: validItems,
                    created_at: new Date().toISOString()
                });
            }
        }
        setMode('list');
        setActiveListId(null);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Apagar esta roleta?')) {
            await deleteDecisionList(id);
        }
    }

    // --- Render ---
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
            <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => mode === 'list' ? onNavigate(Screen.Dashboard) : setMode('list')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-rounded">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Roleta</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto flex flex-col items-center">

                {mode === 'list' && (
                    <div className="w-full max-w-md space-y-4">
                        <button
                            onClick={startCreate}
                            className="w-full p-4 rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                        >
                            <span className="material-symbols-rounded">add_circle</span>
                            Nova Roleta
                        </button>

                        {decisionLists.map(list => (
                            <div
                                key={list.id}
                                onClick={() => { setActiveListId(list.id); setMode('spin'); }}
                                className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-white">
                                        <span className="material-symbols-rounded">casino</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{list.title}</h3>
                                        <p className="text-xs text-text-muted">{list.items.length} opções</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(list); }} className="p-2 hover:bg-black/5 rounded-full">
                                        <span className="material-symbols-rounded text-gray-400">edit</span>
                                    </button>
                                    <button onClick={(e) => handleDelete(e, list.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
                                        <span className="material-symbols-rounded text-red-400">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {mode === 'edit' && (
                    <div className="w-full max-w-md space-y-6">
                        <div>
                            <label className="text-xs font-bold text-text-muted uppercase">Nome da Lista</label>
                            <input
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5 outline-none font-bold text-lg border focus:border-primary"
                                placeholder="Ex: Jantar de Sexta"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Opções</label>
                            <div className="space-y-2">
                                {editItems.map((item, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            value={item}
                                            onChange={e => {
                                                const newItems = [...editItems];
                                                newItems[i] = e.target.value;
                                                setEditItems(newItems);
                                            }}
                                            className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5 outline-none"
                                            placeholder={`Opção ${i + 1}`}
                                        />
                                        <button
                                            onClick={() => setEditItems(prev => prev.filter((_, idx) => idx !== i))}
                                            className="p-3 bg-red-50 text-red-500 rounded-xl"
                                        >
                                            <span className="material-symbols-rounded">remove</span>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setEditItems(prev => [...prev, ''])}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-bold"
                                >
                                    + Adicionar Opção
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={saveList}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30"
                        >
                            Salvar Roleta
                        </button>
                    </div>
                )}

                {mode === 'spin' && activeList && (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                        <div className="relative size-[320px]">
                            <canvas
                                ref={canvasRef}
                                width={320}
                                height={320}
                                className="w-full h-full"
                            />
                            {/* Arrow indicator fixed on the right */}
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 text-black drop-shadow-lg">
                                <span className="material-symbols-rounded text-4xl rotate-180">arrow_left</span>
                            </div>
                        </div>

                        {winner && (
                            <div className="mt-8 animate-[bounceIn_0.5s] text-center">
                                <p className="text-sm font-bold text-text-muted uppercase">O escolhido foi:</p>
                                <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                    {winner}
                                </h2>
                            </div>
                        )}

                        <button
                            onClick={spin}
                            disabled={spinning}
                            className={`mt-8 px-12 py-4 rounded-full font-black text-xl shadow-xl transition-all ${spinning ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:scale-105 active:scale-95'}`}
                        >
                            {spinning ? 'Girando...' : 'GIRAR!'}
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
};
