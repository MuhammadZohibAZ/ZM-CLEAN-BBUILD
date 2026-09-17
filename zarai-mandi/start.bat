@echo off
title Zarai Mandi - Full Stack (Backend + Frontend)
cd /d "%~dp0"

echo ========================================================
echo   Starting Zarai Mandi App (All-in-One)
echo   Backend URL:  http://localhost:8000
echo   Frontend URL: http://localhost:8445
echo ========================================================
echo.

if exist "node_modules\.bin\concurrently.cmd" (
    npm run dev
) else (
    echo Starting Backend server...
    start "Zarai Mandi TTS Backend (Port 8000)" cmd /k "cd /d \"%~dp0backend\" && \"..\\app\\.venv\\Scripts\\uvicorn.exe\" main:app --host 0.0.0.0 --port 8000"
    echo Starting Frontend server...
    cd "app"
    npm run dev
)
