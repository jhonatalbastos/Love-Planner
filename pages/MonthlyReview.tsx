import React, { useState, useMemo } from 'react';
import { useContentStore } from '../stores/useContentStore';

interface Props {
    onBack: () => void;
}

export const MonthlyReview: React.FC<Props> = ({ onBack }) => {
    const logs = useContentStore(state => state.logs);
    const goals = useContentStore(state => state.goals);
    const agreements = useContentStore(state => state.agreements);
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // --- Data Processing ---

    const monthData = useMemo(() => {
        const data = [];
        let totalRating = 0;
        let daysWithRating = 0;
        let intimacyCount = 0;
        let conflictCount = 0;
        let totalTasksDone = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Log Data
            const log = logs.find(l => l.date.startsWith(dateStr));
            if (log) {
                totalRating += log.rating;
                daysWithRating++;
                if (log.intimacy) intimacyCount++;
                if (log.conflict) conflictCount++;
            }

            // Goals Done
            const goalsDone = goals.filter(g => g.completedDates?.includes(dateStr));

            // Agreements Done
            const agreementsDone = agreements.filter(a => a.completedDates?.includes(dateStr));

            const dailyTaskCount = goalsDone.length + agreementsDone.length;
            totalTasksDone += dailyTaskCount;

            data.push({
                day,
                dateStr,
                log,
                goalsDone,
                agreementsDone,
                taskCount: dailyTaskCount,
                hasActivity: !!log || dailyTaskCount > 0
            });
        }

        return {
            days: data,
            avgRating: daysWithRating > 0 ? (totalRating / daysWithRating).toFixed(1) : '-',
            intimacyCount,
            conflictCount,
            totalTasksDone
        };
    }, [logs, goals, agreements, year, month, daysInMonth]);

    // --- Render Helpers ---

    const getRatingColor = (rating?: number) => {
        if (rating === undefined) return 'bg-gray-100 dark:bg-white/5';
        if (rating >= 9) return 'bg-green-500 text-white';
        if (rating >= 7) return 'bg-green-400 text-white';
        if (rating >= 5) return 'bg-yellow-400 text-white';
        if (rating >= 3) return 'bg-orange-400 text-white';
        return 'bg-red-500 text-white';
    };

    const getActivityColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 dark:bg-white/5';
        if (count >= 5) return 'bg-primary text-white';
        if (count >= 3) return 'bg-primary/70 text-white';
        if (count >= 1) return 'bg-primary/40 text-white';
        return 'bg-gray-100 dark:bg-white/5';
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/10 dark:border-white/5 px-4 py-3 flex items-center justify-between">
                <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-rounded text-[24px]">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">Panorama Mensal</h1>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 p-4 space-y-8 pb-10">

                {/* Month Selector */}
                <div className="flex items-center justify-between bg-card-light dark:bg-card-dark p-2 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <span className="material-symbols-rounded">chevron_left</span>
                    </button>
                    <span className="text-lg font-bold capitalize">{monthName}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <span className="material-symbols-rounded">chevron_right</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-primary/10 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-primary">{monthData.avgRating}</span>
                        <span className="text-xs font-bold text-text-muted uppercase">Média Humor</span>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-primary/10 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-blue-500">{monthData.totalTasksDone}</span>
                        <span className="text-xs font-bold text-text-muted uppercase">Tarefas Feitas</span>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-primary/10 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-pink-500">{monthData.intimacyCount}</span>
                        <span className="text-xs font-bold text-text-muted uppercase">Momentos Íntimos</span>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-primary/10 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-orange-500">{monthData.conflictCount}</span>
                        <span className="text-xs font-bold text-text-muted uppercase">Discussões</span>
                    </div>
                </div>

                {/* Heatmaps Section */}
                <section className="space-y-6">

                    {/* Mood Heatmap */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-text-muted uppercase px-1">Heatmap de Humor</h3>
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <span key={d} className="text-center text-[10px] text-gray-400 font-bold">{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {/* Empty slots for start of month */}
                                {[...Array(new Date(year, month, 1).getDay())].map((_, i) => <div key={`e-${i}`} />)}

                                {monthData.days.map((dayData) => (
                                    <div
                                        key={dayData.day}
                                        className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${getRatingColor(dayData.log?.rating)}`}
                                    >
                                        {dayData.day}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-3 text-[10px] text-gray-400 px-1">
                                <span>Triste 😔</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                                <span>Feliz 😍</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Heatmap */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-text-muted uppercase px-1">Heatmap de Produtividade</h3>
                        <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <span key={d} className="text-center text-[10px] text-gray-400 font-bold">{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {[...Array(new Date(year, month, 1).getDay())].map((_, i) => <div key={`e2-${i}`} />)}

                                {monthData.days.map((dayData) => (
                                    <div
                                        key={dayData.day}
                                        className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${getActivityColor(dayData.taskCount)}`}
                                    >
                                        {dayData.day}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-3 text-[10px] text-gray-400 px-1">
                                <span>Pouco</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                                    <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                </div>
                                <span>Muito</span>
                            </div>
                        </div>
                    </div>

                </section>

                {/* Detailed Timeline */}
                <section>
                    <h3 className="text-lg font-bold mb-4 px-1">Detalhes do Dia a Dia</h3>
                    <div className="space-y-4">
                        {monthData.days.filter(d => d.hasActivity).reverse().map((dayData) => (
                            <div key={dayData.day} className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-100 dark:bg-white/10 text-text-muted dark:text-white px-2 py-1 rounded-md text-sm font-bold">
                                            Dia {dayData.day}
                                        </span>
                                        <span className="text-xs text-gray-400 uppercase font-semibold">
                                            {new Date(dayData.dateStr).toLocaleDateString('pt-BR', { weekday: 'short' })}
                                        </span>
                                    </div>
                                    {dayData.log && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-gray-400">Humor:</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${getRatingColor(dayData.log.rating)}`}>
                                                {dayData.log.rating}/10
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Log Details */}
                                {dayData.log && (
                                    <div className="mb-3 space-y-2">
                                        {dayData.log.summary && (
                                            <p className="text-sm italic text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-black/20 p-2 rounded-lg border-l-2 border-primary/30">
                                                "{dayData.log.summary}"
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {dayData.log.intimacy && (
                                                <span className="text-[10px] font-bold bg-pink-100 text-pink-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                    <span className="material-symbols-rounded text-[12px]">favorite</span> Intimidade
                                                </span>
                                            )}
                                            {dayData.log.conflict && (
                                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                    <span className="material-symbols-rounded text-[12px]">warning</span> Discussão
                                                </span>
                                            )}

                                            {/* Love Languages */}
                                            {((dayData.log.partnerLoveLanguages?.length || 0) + (dayData.log.myLoveLanguages?.length || 0) > 0) && (
                                                <div className="w-full flex flex-wrap gap-1 mt-1">
                                                    {[...(dayData.log.partnerLoveLanguages || []), ...(dayData.log.myLoveLanguages || [])].map((lang, idx) => (
                                                        <span key={idx} className="text-[9px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tasks Completed */}
                                {(dayData.goalsDone.length > 0 || dayData.agreementsDone.length > 0) ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-text-muted uppercase mb-1">Concluído neste dia:</p>
                                        {dayData.goalsDone.map(g => (
                                            <div key={g.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <span className="material-symbols-rounded text-[16px] text-green-500">check_circle</span>
                                                <span className="truncate flex-1">Meta: {g.title}</span>
                                            </div>
                                        ))}
                                        {dayData.agreementsDone.map(a => (
                                            <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <span className="material-symbols-rounded text-[16px] text-blue-500">task_alt</span>
                                                <span className="truncate flex-1">Acordo: {a.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Nenhuma tarefa registrada.</p>
                                )}
                            </div>
                        ))}

                        {monthData.days.filter(d => d.hasActivity).length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <p>Nenhuma atividade registrada neste mês.</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};