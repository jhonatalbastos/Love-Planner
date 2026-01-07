@chcp 65001 >nul
echo ==========================================
echo  Love Planner - Sincronização com GitHub
echo ==========================================

echo [1/5] Verificando Git...
git --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Git não encontrado!
    echo Por favor, instale o Git para Windows (https://git-scm.com/download/win^)
    echo e reinicie este terminal ou o computador.
    echo.
    pause
    exit /b
)

echo [2/5] Inicializando repositório...
if not exist .git (
    git init
    echo Repositório iniciado.
) else (
    echo Repositório já existe.
)

echo [3/5] Configurando remoto...
git remote remove origin 2>nul
git remote add origin https://github.com/jhonatalbastos/Love-Planner.git
echo Remoto configurado: https://github.com/jhonatalbastos/Love-Planner.git

echo [4/5] Preparando arquivos...
git branch -M main
git add .
git commit -m "feat: Atualização completa do Love Planner (AI Journal & Fixes)"

echo [5/5] Enviando para o GitHub...
echo Atenção: Se houver erro de permissão, uma janela de login pode abrir.
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Se o push falhou pq o remoto tem historico diferente,
    echo tentaremos forçar (apenas se for seu repo pessoal novo).
    choice /M "Deseja forçar o envio? (Isso pode sobrescrever o remoto)"
    if %errorlevel% equ 1 (
        git push -u origin main --force
    )
)

echo.
echo ==========================================
echo  Processo Finalizado!
echo ==========================================
pause
