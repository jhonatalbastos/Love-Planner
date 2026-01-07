import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login, loginWithGoogle, register, error, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific state
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [startDate, setStartDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      // Combine names for storage
      const combinedNames = `${name1.trim()} & ${name2.trim()}`;
      // Pass startDate if present
      await register(email, password, combinedNames, startDate || undefined);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden border border-primary/10 relative">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/20 to-transparent"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-10 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 px-8 py-10 flex flex-col gap-6">
          <div className="text-center">
             <div className="mx-auto size-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary shadow-inner">
                <span className="material-symbols-rounded text-4xl">all_inclusive</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Love Planner</h1>
             <p className="text-sm text-text-muted mt-1">
               {isRegistering ? 'Crie sua conta para começar' : 'Bem-vindo de volta'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
             {error && (
               <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-xl text-center border border-red-100 dark:border-red-900/30">
                 {error}
               </div>
             )}

             {isRegistering && (
               <>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-text-muted uppercase ml-1">Seu Nome</label>
                     <div className="relative">
                        <span className="material-symbols-rounded absolute left-3 top-3 text-gray-400 text-[18px]">person</span>
                        <input 
                          type="text" 
                          placeholder="Ex: Romeu"
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-9 pr-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                          value={name1}
                          onChange={e => setName1(e.target.value)}
                          required
                        />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-text-muted uppercase ml-1">Parceiro(a)</label>
                     <div className="relative">
                        <span className="material-symbols-rounded absolute left-3 top-3 text-gray-400 text-[18px]">favorite</span>
                        <input 
                          type="text" 
                          placeholder="Ex: Julieta"
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-9 pr-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                          value={name2}
                          onChange={e => setName2(e.target.value)}
                          required
                        />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <div className="flex justify-between items-center px-1">
                     <label className="text-xs font-bold text-text-muted uppercase">Início do Namoro</label>
                     <span className="text-[10px] text-gray-400 font-medium">Opcional</span>
                   </div>
                   <div className="relative">
                      <span className="material-symbols-rounded absolute left-3 top-3 text-gray-400">calendar_month</span>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm text-gray-600 dark:text-gray-300"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                   </div>
                 </div>
               </>
             )}

             <div className="space-y-1">
               <label className="text-xs font-bold text-text-muted uppercase ml-1">Email</label>
               <div className="relative">
                  <span className="material-symbols-rounded absolute left-3 top-3 text-gray-400">mail</span>
                  <input 
                    type="email" 
                    placeholder="seu@email.com"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-bold text-text-muted uppercase ml-1">Senha</label>
               <div className="relative">
                  <span className="material-symbols-rounded absolute left-3 top-3 text-gray-400">lock</span>
                  <input 
                    type="password" 
                    placeholder="******"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
               </div>
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="mt-2 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {loading && <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span>}
               {isRegistering ? 'Criar Conta' : 'Entrar'}
             </button>
          </form>

          {/* Social Login Section */}
          <div className="flex flex-col gap-4">
             <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-100 dark:border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-gray-400">ou entre com</span>
                <div className="flex-grow border-t border-gray-100 dark:border-white/10"></div>
             </div>

             <button
               onClick={loginWithGoogle}
               disabled={loading}
               className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
             >
               <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Google
             </button>
             
             <button
               onClick={() => setShowHelp(true)}
               className="text-xs text-text-muted hover:underline flex items-center justify-center gap-1"
             >
               <span className="material-symbols-rounded text-[14px]">help</span>
               Erro: "Você não tem acesso a esta página"?
             </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-100 dark:border-white/10"></div>
          </div>

          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-center text-text-muted font-medium hover:underline transition-all"
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>

      {/* Troubleshooting Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowHelp(false)}>
           <div className="bg-white dark:bg-card-dark rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                  <h3 className="font-bold text-lg text-primary">Solução Definitiva (Erro 403)</h3>
                  <button onClick={() => setShowHelp(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                      <span className="material-symbols-rounded">close</span>
                  </button>
               </div>
               <div className="p-5 text-sm space-y-4 text-gray-700 dark:text-gray-300">
                  <p className="font-semibold text-gray-900 dark:text-white">
                     Se você já adicionou seu e-mail, conferiu o ID e ainda dá erro, a solução é <b>Publicar o App</b>.
                  </p>

                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                    <strong className="block mb-2 text-green-700 dark:text-green-300">Como Resolver:</strong>
                    <ol className="list-decimal list-inside mt-2 ml-1 text-xs opacity-90 space-y-2">
                       <li>Vá na <b>Tela de Permissão OAuth</b> (OAuth Consent Screen) no Google Cloud.</li>
                       <li>Procure o botão <b>"PUBLISH APP"</b> (Publicar Aplicativo) abaixo de "Publishing Status".</li>
                       <li>Confirme a publicação.</li>
                       <li><b>Pronto!</b> Agora o login vai funcionar para qualquer e-mail.</li>
                    </ol>
                    <p className="mt-2 text-[10px] text-green-800 dark:text-green-200 opacity-80">
                      Nota: O Google vai mostrar uma tela de aviso "O Google não verificou este app". Isso é normal. Basta clicar em <b>Avançado</b> {'>'} <b>Acessar (inseguro)</b> para entrar.
                    </p>
                  </div>
               </div>
               <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                 <button onClick={() => setShowHelp(false)} className="w-full py-2 bg-gray-200 dark:bg-white/10 rounded-lg font-bold text-sm">Entendi</button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};