import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { jsPDF } from 'jspdf';

interface Props {
  onBack: () => void;
}

export const Export: React.FC<Props> = ({ onBack }) => {
  const { logs, goals, userProfile, stats } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter options state
  const [includeJournal, setIncludeJournal] = useState(true);
  const [includeGratitude, setIncludeGratitude] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    // Slight delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(244, 37, 54); // Primary Red
        doc.text("Love Planner - Relatório", pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Casal: ${userProfile.names}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        // --- Stats ---
        doc.setFillColor(255, 240, 240);
        doc.rect(10, yPos, pageWidth - 20, 25, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Dias Juntos: ${stats.daysTogether}`, 20, yPos + 10);
        doc.text(`Nível do Casal: ${stats.level}`, 20, yPos + 18);
        doc.text(`Total de Registros: ${logs.length}`, 110, yPos + 10);
        doc.text(`Pontuação de Alma Gêmea: ${stats.soulmateScore}%`, 110, yPos + 18);
        yPos += 40;

        // --- Journal Entries ---
        if (includeJournal) {
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text("Diário do Casal", 10, yPos);
            yPos += 10;
            
            // Loop through logs
            for (const log of logs) {
                // Check page break
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                const dateStr = new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                doc.setFontSize(12);
                doc.setTextColor(244, 37, 54);
                doc.text(dateStr, 10, yPos);
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Nota: ${log.rating}/10`, pageWidth - 30, yPos);
                yPos += 8;

                if (log.summary) {
                    doc.setTextColor(0);
                    const splitSummary = doc.splitTextToSize(`Resumo: ${log.summary}`, pageWidth - 20);
                    doc.text(splitSummary, 10, yPos);
                    yPos += (splitSummary.length * 5) + 2;
                }

                if (includeGratitude && log.gratitude) {
                    doc.setTextColor(80);
                    doc.setFontSize(9);
                    const splitGratitude = doc.splitTextToSize(`Gratidão: ${log.gratitude}`, pageWidth - 20);
                    doc.text(splitGratitude, 10, yPos);
                    yPos += (splitGratitude.length * 5) + 2;
                }

                // Photos
                if (includePhotos && log.photo) {
                    try {
                        // Assuming log.photo is base64 string
                        // Keep aspect ratio roughly, max height 60
                        const imgProps = doc.getImageProperties(log.photo);
                        const imgWidth = 80;
                        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                        
                        // Check space for image
                        if (yPos + imgHeight > 270) {
                            doc.addPage();
                            yPos = 20;
                        }

                        doc.addImage(log.photo, 'JPEG', 10, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 5;
                    } catch (e) {
                        console.error("Error adding image to PDF", e);
                    }
                }

                yPos += 10; // Spacing between entries
                doc.setDrawColor(200);
                doc.line(10, yPos, pageWidth - 10, yPos); // Separator
                yPos += 10;
            }
        }

        // --- Goals ---
        if (includeGoals) {
             if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            yPos += 10;
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text("Metas & Conquistas", 10, yPos);
            yPos += 10;

            const completedGoals = goals.filter(g => g.completed);
            const activeGoals = goals.filter(g => !g.completed);

            doc.setFontSize(11);
            doc.text(`Concluídas: ${completedGoals.length} | Em andamento: ${activeGoals.length}`, 10, yPos);
            yPos += 10;

            activeGoals.forEach(g => {
                doc.setFontSize(10);
                doc.setTextColor(50);
                doc.text(`[ ] ${g.title}: ${g.current}/${g.target}`, 10, yPos);
                yPos += 6;
            });
        }

        doc.save(`LovePlanner_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark animate-[fadeIn_0.3s_ease-out]">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors">
          <span className="material-symbols-rounded text-[24px]">arrow_back_ios_new</span>
        </button>
        <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">Exportar Relatório</h2>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 flex flex-col gap-6 px-4 pt-4">
        <div className="relative w-full overflow-hidden rounded-xl shadow-lg group">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAvN2G3skNukTG06lkjaBs_8EUWimB2T3_e7sglV99Jepv2JJefmJPXPfsuEZ-INLxd0Cp8oTS4iSGkwvZMVPsVQfo_Zk5F7toetYN6FMJakgD-NVyn2exqYbFwad3lzk3i1sy-Fyxov_8OUvu4hLaMDbYmhF7ljleroeLEwoJoWZ869vGO0ZbS2A_2sOWMmhOtxhS11grjgP6OOyaVZCSHVPc7rgSEf8mdXaKA-juPMKxEksHkmA_6f5xuR0j40d0ltXUWAaeMu7w")'}}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
          <div className="relative flex flex-col items-center justify-end p-6 pt-12 text-center min-h-[240px]">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
              <span className="material-symbols-rounded text-white text-[32px]">picture_as_pdf</span>
            </div>
            <span className="mb-1 text-sm font-medium uppercase tracking-widest text-white/80">Resumo do Mês</span>
            <h1 className="text-3xl font-bold text-white">Atual</h1>
            <p className="mt-2 text-sm text-white/70 max-w-[200px]">Inclui {logs.length} registros e {goals.filter(g => g.completed).length} conquistas.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="px-2 text-lg font-bold tracking-tight">O que incluir?</h3>
          <p className="px-2 text-sm text-text-muted -mt-1 mb-2">Personalize o conteúdo do seu relatório.</p>
          <div className="flex flex-col gap-3">
            {[
              { id: 'journal', icon: 'book_2', title: 'Diário do Casal', sub: 'Registros diários e notas', color: 'text-primary', state: includeJournal, setter: setIncludeJournal },
              { id: 'gratitude', icon: 'favorite', title: 'Mural da Gratidão', sub: 'Momentos especiais e agradecimentos', color: 'text-pink-500', state: includeGratitude, setter: setIncludeGratitude },
              { id: 'goals', icon: 'flag', title: 'Metas Alcançadas', sub: 'Progresso dos objetivos mensais', color: 'text-orange-500', state: includeGoals, setter: setIncludeGoals },
              { id: 'photos', icon: 'photo_library', title: 'Galeria de Fotos', sub: 'Incluir fotos anexadas', color: 'text-indigo-500', state: includePhotos, setter: setIncludePhotos }
            ].map((item, i) => (
              <label key={i} className="group relative flex cursor-pointer items-center justify-between rounded-2xl bg-white dark:bg-card-dark p-4 shadow-sm border border-border-light dark:border-white/5 transition-all hover:border-primary/30 active:scale-[0.99]">
                <div className="flex items-center gap-4">
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 ${item.color}`}>
                    <span className="material-symbols-rounded">{item.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold leading-tight">{item.title}</span>
                    <span className="text-xs text-text-muted">{item.sub}</span>
                  </div>
                </div>
                <div className="relative flex h-7 w-12 items-center">
                  <input 
                    type="checkbox" 
                    checked={item.state} 
                    onChange={(e) => item.setter(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-7 w-12 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-primary"></div>
                  <div className="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 z-30 w-full p-4">
        <div className="absolute inset-0 -top-6 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pointer-events-none"></div>
        <div className="relative flex flex-col items-center gap-3">
          <button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="relative w-full overflow-hidden rounded-full bg-primary py-4 text-center font-bold text-white shadow-lg shadow-primary/25 transition-transform active:scale-[0.98] hover:shadow-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-70 disabled:cursor-wait"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="material-symbols-rounded text-[20px]">{isGenerating ? 'hourglass_empty' : 'download'}</span>
              {isGenerating ? 'Gerando Arquivo...' : 'Gerar PDF'}
            </span>
          </button>
          <p className="text-xs text-text-muted font-medium">O arquivo será salvo nos seus documentos.</p>
        </div>
      </div>
    </div>
  );
};