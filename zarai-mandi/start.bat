@echo off
title Zarai Mandi - Market API + Frontend
cd /d "%~dp0"

echo ========================================================
echo   Starting Zarai Mandi App (All-in-One)
echo   Market API URL:    http://localhost:8090
echo   Frontend URL:      http://localhost:8445
echo   (Market API running on embedded SQLite database)
echo ========================================================
echo.

if exist "node_modules\.bin\concurrently.cmd" (
    npm run dev
) else (
    echo Starting Market API server...
    start "Zarai Mandi Market API (Port 8090)" cmd /k "cd /d \"%~dp0api\" && npm run start"
    echo Starting Frontend server...
    cd "app"
    npm run dev
)
