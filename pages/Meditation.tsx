import React, { useState, useEffect } from 'react';
import { Screen } from '../types';

interface MeditationProps {
    onNavigate: (screen: Screen) => void;
}

const MEDITATIONS = [
    { id: 1, title: 'Respiração Conectada', duration: 5, color: 'bg-indigo-500', icon: 'air' },
    { id: 2, title: 'Gratidão a Dois', duration: 10, color: 'bg-rose-500', icon: 'favorite' },
    { id: 3, title: 'Relaxamento Profundo', duration: 15, color: 'bg-teal-500', icon: 'spa' },
];

export const Meditation: React.FC<MeditationProps> = ({ onNavigate }) => {
    const [activeSession, setActiveSession] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (activeSession) {
                // Session ended
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, activeSession]);

    const startSession = (durationMinutes: number, id: number) => {
        setActiveSession(id);
        setTimeLeft(durationMinutes * 60);
        setIsActive(true);
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentSession = activeSession ? MEDITATIONS.find(m => m.id === activeSession) : null;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
            <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 dark:border-white/10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => onNavigate(Screen.Dashboard)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-rounded">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Meditação a Dois</h1>
            </header>

            <main className="flex-1 p-4 flex flex-col gap-6">

                {/* Active Session View */}
                {activeSession ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-10">
                        <div className={`relative w-64 h-64 rounded-full flex items-center justify-center mb-8 ${currentSession?.color} bg-opacity-10 animate-pulse`}>
                            <div className={`absolute inset-0 rounded-full ${currentSession?.color} blur-3xl opacity-20`}></div>
                            <div className="z-10 text-center">
                                <span className="material-symbols-rounded text-6xl text-primary/80 mb-4">{currentSession?.icon}</span>
                                <div className="text-5xl font-mono font-bold tracking-wider">{formatTime(timeLeft)}</div>
                                <p className="text-sm font-medium opacity-60 mt-2">{isActive ? 'Respire...' : 'Pausado'}</p>
                            </div>

                            {/* Breathing Animation Circle */}
                            {isActive && (
                                <div className={`absolute inset-0 rounded-full border-4 border-primary/30 animate-[ping_4s_ease-in-out_infinite]`}></div>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold mb-8">{currentSession?.title}</h2>

                        <div className="flex gap-4">
                            <button
                                onClick={toggleTimer}
                                className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-rounded text-3xl">{isActive ? 'pause' : 'play_arrow'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveSession(null);
                                    setIsActive(false);
                                }}
                                className="size-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-rounded text-2xl">close</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <section className="bg-indigo-500 rounded-2xl p-6 text-white text-center shadow-lg shadow-indigo-500/20">
                            <span className="material-symbols-rounded text-5xl mb-2 opacity-80">self_improvement</span>
                            <h2 className="text-xl font-bold mb-1">Momento de Conexão</h2>
                            <p className="text-indigo-100 text-sm">
                                Dediquem alguns minutos para respirar juntos e sincronizar suas energias.
                            </p>
                        </section>

                        <section className="grid gap-3">
                            <h3 className="font-bold text-lg px-1">Sessões Disponíveis</h3>
                            {MEDITATIONS.map(med => (
                                <div
                                    key={med.id}
                                    onClick={() => startSession(med.duration, med.id)}
                                    className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-primary/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-full ${med.color} bg-opacity-10 flex items-center justify-center text-primary`}>
                                            <span className="material-symbols-rounded">{med.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold">{med.title}</h4>
                                            <p className="text-xs text-text-muted">{med.duration} minutos</p>
                                        </div>
                                    </div>
                                    <button className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                        <span className="material-symbols-rounded">play_arrow</span>
                                    </button>
                                </div>
                            ))}
                        </section>
                    </>
                )}

            </main>
        </div>
    );
};
