import { createClient } from '@supabase/supabase-js';

// ==================================================================================
// ⚙️ CONFIGURAÇÃO DO SUPABASE (PASSO 3)
// ==================================================================================
// Para conectar o app, você precisa colar suas credenciais abaixo.
//
// 1. Acesse o painel do seu projeto no Supabase (supabase.com/dashboard)
// 2. Vá em: Settings (ícone de engrenagem) -> API
// 3. Copie a "Project URL" e cole abaixo na variável SUPABASE_URL
// 4. Copie a chave "anon" / "public" e cole abaixo na variável SUPABASE_ANON_KEY
// ==================================================================================

const SUPABASE_URL: string = "https://nzzdakelndfrokerqixk.supabase.co"; // <--- COLE SUA URL AQUI (ex: "https://xyz.supabase.co")
const SUPABASE_ANON_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56emRha2VsbmRmcm9rZXJxaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODI2MDEsImV4cCI6MjA4MzM1ODYwMX0.Mb0TV9NLeckoM0gEc9Y_uyvkDVECy1DSdYVJjOnDoTw"; // <--- COLE SUA CHAVE ANON AQUI (ex: "eyJhbGciOiJIUzI1NiIsInR5...")

// ----------------------------------------------------------------------------------

// Verificação para evitar que o app quebre (Tela Branca) se as chaves estiverem vazias
// Se estiverem vazias, usamos valores falsos apenas para o app carregar visualmente.
const url = SUPABASE_URL && SUPABASE_URL.length > 0 ? SUPABASE_URL : "https://placeholder.supabase.co";
const key = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 0 ? SUPABASE_ANON_KEY : "placeholder";

if (!SUPABASE_URL) {
  console.warn("⚠️ CREDENCIAIS AUSENTES: Edite o arquivo lib/supabase.ts e coloque sua URL e Chave do Supabase para o login funcionar.");
}

export const supabase = createClient(url, key);