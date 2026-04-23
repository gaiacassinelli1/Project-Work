@echo off
REM Quick Start - Mare Calmo v2.0 (Windows)

setlocal enabledelayedexpansion

echo Mare Calmo - Quick Start
echo ============================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python non trovato. Installare Python.
    pause
    exit /b 1
)
echo Python trovato

REM Setup Backend
echo.
echo Setup Backend...

cd backend

REM Create virtual environment
if not exist "venv" (
    echo    Creazione virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo    Installazione dipendenze...
pip install -q -r requirements.txt 2>nul

echo Backend configurato

echo.
echo Avvio server backend...
echo    - http://localhost:8000
echo    - Docs: http://localhost:8000/docs
echo.

start cmd /k "cd /d !cd!\backend & venv\Scripts\activate.bat & uvicorn app.main:app --reload --port 8000"

REM Small delay
timeout /t 2 /nobreak

REM Setup Frontend
cd ..
echo.
echo Setup Frontend...

cd frontend

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo npm non trovato. frontend richiede Node.js + npm
    echo    Scarica da: https://nodejs.org/
    pause
    goto end
)

REM Install dependencies
if not exist "node_modules" (
    echo    Installazione dipendenze...
    call npm install -q
)

echo Frontend configurato

echo.
echo Avvio dev server frontend...
echo    - http://localhost:5173
echo.

start cmd /k "cd /d !cd!\frontend & npm run dev"

:end
echo.
echo Mare Calmo è stato avviato!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Docs: http://localhost:8000/docs
echo.
echo Chiudi le finestre di comando per fermare i server.
echo.

pause
