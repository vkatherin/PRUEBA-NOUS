@echo off
title NOUS - Iniciando servidores...
color 0A
cls

echo.
echo  ================================================
echo    NOUS - Plataforma de Gestion de Investigacion
echo  ================================================
echo.
echo  Iniciando servidores, espera un momento...
echo.

REM --- 1. BACKEND (puerto 4200) ---
echo  [1/2] Iniciando Backend  ^(puerto 4200^)...
start "NOUS - Backend" cmd /k "cd /d "%~dp0backend" && color 0B && echo. && echo  *** NOUS Backend corriendo en http://localhost:4200 *** && echo. && npm run dev"

REM Esperar 3 segundos para que el backend arranque primero
timeout /t 3 /nobreak >nul

REM --- 2. FRONTEND (puerto 8443) ---
echo  [2/2] Iniciando Frontend ^(puerto 8443^)...
<<<<<<< HEAD
start "NOUS - Frontend" cmd /k "cd /d \"d:\Practica\NOUS\nous_project\Frontend\Proyecto nous\" && color 0E && echo. && echo  *** NOUS Frontend corriendo en http://localhost:8443 *** && echo. && npm.cmd run dev"
=======
start "NOUS - Frontend" cmd /k "cd /d "%~dp0frontend\Proyecto nous" && color 0E && echo. && echo  *** NOUS Frontend corriendo en http://localhost:8443 *** && echo. && npm run dev"
>>>>>>> main

REM Esperar 5 segundos para que el frontend compile
timeout /t 5 /nobreak >nul

REM --- 3. Abrir navegador ---
echo  [3/3] Abriendo NOUS en el navegador...
start "" "http://localhost:8443"

echo.
echo  ================================================
echo    NOUS esta corriendo!
echo.
echo    Frontend  --^>  http://localhost:8443
echo    Backend   --^>  http://localhost:4200
echo    API Check --^>  http://localhost:4200/api/health
echo.
echo    Para detener: cierra las ventanas
echo    "NOUS - Backend" y "NOUS - Frontend"
echo  ================================================
echo.
pause
