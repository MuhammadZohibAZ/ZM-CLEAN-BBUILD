@echo off
title Zarai Mandi - Full Stack (TTS Backend + Market API + Frontend)
cd /d "%~dp0"

echo ========================================================
echo   Starting Zarai Mandi App (All-in-One)
echo   TTS Backend URL:   http://localhost:8000
echo   Market API URL:    http://localhost:8090
echo   Frontend URL:      http://localhost:8445
echo   (Market API needs Postgres running -- see api/README.md)
echo ========================================================
echo.

if exist "node_modules\.bin\concurrently.cmd" (
    npm run dev
) else (
    echo Starting TTS Backend server...
    start "Zarai Mandi TTS Backend (Port 8000)" cmd /k "cd /d \"%~dp0backend\" && \"..\\app\\.venv\\Scripts\\uvicorn.exe\" main:app --host 0.0.0.0 --port 8000"
    echo Starting Market API server...
    start "Zarai Mandi Market API (Port 8090)" cmd /k "cd /d \"%~dp0api\" && npm run start"
    echo Starting Frontend server...
    cd "app"
    npm run dev
)
