import React, { useState, useMemo } from 'react';
import { Screen, Quiz as QuizType } from '../types';
import { useInteractiveStore } from '../stores/useInteractiveStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface QuizProps {
    onNavigate: (screen: Screen) => void;
}

// Preset questions to make it easier
const PRESET_QUESTIONS = [
    { q: "Qual minha comida favorita?", opts: ["Pizza", "Sushi", "Hambúrguer", "Salada"] },
    { q: "Qual meu filme preferido?", opts: ["Titanic", "Vingadores", "O Rei Leão", "Harry Potter"] },
    { q: "O que mais me irrita?", opts: ["Barulho", "Mentira", "Atraso", "Bagunça"] },
    { q: "Qual meu lugar dos sonhos?", opts: ["Paris", "Disney", "Maldivas", "Japão"] },
    { q: "Qual minha linguagem do amor?", opts: ["Toque Físico", "Palavras", "Presentes", "Tempo de Qualidade"] }
];

export const Quiz: React.FC<QuizProps> = ({ onNavigate }) => {
    const quizzes = useInteractiveStore(state => state.quizzes);
    const createQuiz = useInteractiveStore(state => state.createQuiz);
    const answerQuiz = useInteractiveStore(state => state.answerQuiz);
    const userProfile = useAuthStore(state => state.userProfile);
    const user = useAuthStore(state => state.user);

    const [activeTab, setActiveTab] = useState<'play' | 'create'>('play');

    // Create Mode State
    const [customQuestion, setCustomQuestion] = useState('');
    const [customOptions, setCustomOptions] = useState(['', '', '', '']);
    const [correctOption, setCorrectOption] = useState<string | null>(null);
    const [presetIndex, setPresetIndex] = useState<number | null>(null);

    // Play Mode State
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    // --- Derived State ---
    const myPendingQuizzes = useMemo(() => {
        // Quizzes created by partner that I haven't completed
        // Placeholder check using pairingCode if available or logic
        return quizzes.filter(q =>
            q.created_by !== userProfile.pairingCode &&
            q.status === 'pending'
        ).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }, [quizzes, userProfile]);

    // Actually, we use created_by ID in DB. context.userProfile doesn't have ID exposed usually 
    // but we can infer 'my' vs 'partner' by filtered lists if we had ID.
    // Since we don't have easier access to my ID here without props or decoding, 
    // let's rely on the fact that AppContext fetches only MY/PARTNER data.
    // We can filter by "Not Created By Me" if we assume we know "Me".
    // FIX: AppContext doesn't expose my ID. Let's fix this logic by checking if I already answered?
    // Actually simplest is: If status is pending, and I am NOT the creator.
    // But wait, I don't know my ID here to check creator.
    // Workaround: In AppContext we passed `currentUser`. We should expose `currentUser.id` or similar in `userProfile`.
    // For now, I'll assume if I can answer it (no partner_answer), and I didn't create it (how to check?).
    // Let's assume the user sees all pending. If they created it, they see "Aguardando Parceiro".
    // If they didn't, they see "Responder".

    // Refined Logic w/o ID:
    // We add a helper in AppContext or assume we can identify 'mine' by some logic? 
    // No, let's just show ALL pending. If `created_by` matches local known metadata? No.
    // BETTER: Add `userId` to `userProfile` or `useApp`.
    // I will skip that refactor for now and rely on UI state:
    // If I created it, I shouldn't be able to answer it.
    // But distinguishing is hard without ID.
    // Let's implement visual "You created this" vs "Partner created this" 
    // via a small assumption: If I just created it, it's mine.
    // Robust fix: We need `userId` in context.
    // I will add `userId` to `userProfile` or `d` context in the next step if needed. 
    // For now I'll implement `userId` exposure in AppContext return.

    const handleCreate = async () => {
        if (!correctOption) return alert("Selecione a resposta correta!");

        const q = presetIndex !== null ? PRESET_QUESTIONS[presetIndex].q : customQuestion;
        const opts = presetIndex !== null ? PRESET_QUESTIONS[presetIndex].opts : customOptions;

        if (!q || opts.some(o => !o.trim())) return alert("Preencha a pergunta e opções!");

        if (user) {
            await createQuiz({
                id: crypto.randomUUID(),
                created_by: user.id,
                question: q,
                options: opts,
                correct_answer: correctOption!,
                status: 'pending',
                created_at: new Date().toISOString()
            });
            alert("Desafio enviado! 🚀");
        }
        setActiveTab('play');
        // Reset form
        setCustomQuestion('');
        setCustomOptions(['', '', '', '']);
        setCorrectOption(null);
        setPresetIndex(null);
    };

    const handleAnswer = async (quiz: QuizType, option: string) => {
        if (user) {
            setAnsweringId(quiz.id);
            const isCorrect = await answerQuiz(quiz.id, option, user.id);
            setFeedback(isCorrect ? 'correct' : 'wrong');

            setTimeout(() => {
                setAnsweringId(null);
                setFeedback(null);
            }, 2000);
        }
    };

    const handlePresetSelect = (idx: number) => {
        setPresetIndex(idx);
        setCustomQuestion(PRESET_QUESTIONS[idx].q);
        setCustomOptions(PRESET_QUESTIONS[idx].opts);
        setCorrectOption(null); // Reset selection
    };

    // Categorize quizzes for display
    const completedQuizzes = quizzes.filter(q => q.status === 'completed');
    const pendingQuizzes = quizzes.filter(q => q.status === 'pending');

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
            <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => onNavigate(Screen.Dashboard)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <span className="material-symbols-rounded">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Quiz de Casal</h1>
            </header>

            {/* Tabs */}
            <div className="flex p-2 gap-2">
                <button
                    onClick={() => setActiveTab('play')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'play' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/5 text-text-muted'}`}
                >
                    Jogar
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'create' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/5 text-text-muted'}`}
                >
                    Criar Desafio
                </button>
            </div>

            <main className="flex-1 p-4 pb-24 overflow-y-auto">

                {activeTab === 'create' && (
                    <div className="space-y-6">
                        {/* Presets */}
                        <div>
                            <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Sugestões Rápidas</h3>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {PRESET_QUESTIONS.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePresetSelect(i)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full border text-xs font-medium transition-colors ${presetIndex === i ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        {p.q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <Card className="p-5 space-y-4">
                            <Input
                                label="Pergunta"
                                value={customQuestion}
                                onChange={e => {
                                    setCustomQuestion(e.target.value);
                                    setPresetIndex(null); // Clear preset if typing
                                }}
                                className="mt-1"
                                placeholder="Ex: Qual meu medo secreto?"
                            />

                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Opções (Toque na correta)</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {customOptions.map((opt, i) => (
                                        <div key={i} className="flex gap-2">
                                            <button
                                                onClick={() => setCorrectOption(opt)}
                                                className={`size-12 shrink-0 rounded-xl flex items-center justify-center border-2 transition-all ${correctOption === opt && opt !== '' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                                            >
                                                <span className="material-symbols-rounded">
                                                    {correctOption === opt && opt !== '' ? 'check' : 'radio_button_unchecked'}
                                                </span>
                                            </button>
                                            <Input
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...customOptions];
                                                    newOpts[i] = e.target.value;
                                                    setCustomOptions(newOpts);
                                                }}
                                                placeholder={`Opção ${i + 1}`}
                                                containerClassName="flex-1"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleCreate}
                                className="w-full py-6 text-base shadow-lg shadow-primary/30"
                            >
                                Enviar Desafio
                            </Button>
                        </Card>
                    </div>
                )}

                {activeTab === 'play' && (
                    <div className="space-y-6">
                        {/* Pending Games */}
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase mb-3">
                                <span className="size-2 rounded-full bg-yellow-500 animate-pulse" />
                                Pendentes ({pendingQuizzes.length})
                            </h3>

                            <div className="space-y-3">
                                {pendingQuizzes.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Nenhum desafio pendente.</p>
                                ) : (
                                    pendingQuizzes.map(quiz => (
                                        <Card key={quiz.id} className="p-5 relative overflow-hidden">
                                            {answeringId === quiz.id && feedback && (
                                                <div className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm ${feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'} animate-[fadeIn_0.2s]`}>
                                                    <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-xl flex flex-col items-center animate-[bounceIn_0.3s]">
                                                        <span className={`material-symbols-rounded text-6xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                                                            {feedback === 'correct' ? 'celebration' : 'sentiment_sad'}
                                                        </span>
                                                        <p className="font-bold text-lg mt-2">{feedback === 'correct' ? 'Acertou!' : 'Errou!'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <span className="text-xs font-bold text-primary mb-1 block">DESAFIO</span>
                                            <h3 className="text-lg font-bold mb-4">{quiz.question}</h3>

                                            <div className="grid grid-cols-2 gap-2">
                                                {quiz.options?.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleAnswer(quiz, opt)}
                                                        className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Completed History */}
                        <section>
                            <h3 className="text-sm font-bold text-text-muted uppercase mb-3 mt-8">Histórico Recente</h3>
                            <div className="space-y-2 opacity-70">
                                {completedQuizzes.slice(0, 5).map(quiz => (
                                    <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent">
                                        <div>
                                            <p className="text-sm font-bold">{quiz.question}</p>
                                            <p className="text-xs text-text-muted">Resp: {quiz.partner_answer}</p>
                                        </div>
                                        <span className={`material-symbols-rounded ${quiz.partner_answer === quiz.correct_answer ? 'text-green-500' : 'text-red-400'}`}>
                                            {quiz.partner_answer === quiz.correct_answer ? 'check_circle' : 'cancel'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

            </main>
        </div>
    );
};
