@echo off
title NOUS - Subir a GitHub
color 0A
cls

echo.
echo  ================================================
echo    NOUS - Subir proyecto a GitHub
echo    Repositorio: https://github.com/ChrisDreams1/nous.git
echo  ================================================
echo.

REM Verificar que git este instalado
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERROR] Git no esta instalado.
    echo.
    echo  Descargalo desde: https://git-scm.com/download/win
    echo  Luego cierra esta ventana y ejecuta este script de nuevo.
    echo.
    pause
    exit /b 1
)

echo  Git encontrado. Continuando...
echo.

REM Ir a la carpeta del proyecto
cd /d "%~dp0"

REM Inicializar repo si no existe
if not exist ".git" (
    echo  [1/6] Inicializando repositorio Git...
    git init
    echo.
) else (
    echo  [1/6] Repositorio Git ya existe. Continuando...
    echo.
)

REM Agregar todos los archivos
echo  [2/6] Agregando archivos al repositorio...
git add .
echo.

REM Verificar si ya hay commits
git log --oneline -1 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [3/6] Creando primer commit...
    git commit -m "feat: proyecto NOUS - commit inicial"
) else (
    echo  [3/6] Creando commit con cambios...
    git commit -m "feat: actualizacion del proyecto NOUS"
)
echo.

REM Renombrar rama a main
echo  [4/6] Configurando rama main...
git branch -M main
echo.

REM Conectar con GitHub (si no esta conectado)
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [5/6] Conectando con GitHub...
    git remote add origin https://github.com/ChrisDreams1/nous.git
) else (
    echo  [5/6] Actualizando URL de GitHub...
    git remote set-url origin https://github.com/ChrisDreams1/nous.git
)
echo.

REM Subir codigo
echo  [6/6] Subiendo codigo a GitHub...
echo  (Se pedira tu usuario y token de GitHub)
echo.
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo  ================================================
    echo    Codigo subido exitosamente!
    echo    Ver en: https://github.com/ChrisDreams1/nous
    echo  ================================================
) else (
    color 0C
    echo  ================================================
    echo    Hubo un error al subir. Revisa:
    echo    1. Que tu token de GitHub es valido
    echo    2. Que tienes acceso al repositorio
    echo    Ver: https://github.com/settings/tokens
    echo  ================================================
)
echo.
pause
