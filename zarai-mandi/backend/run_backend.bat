@echo off
title Zarai Mandi Urdu TTS Backend (facebook/mms-tts-urd)
cd /d "%~dp0"

echo ========================================================
echo   Starting Zarai Mandi Urdu Neural TTS Server
echo   Model: facebook/mms-tts-urd (VITS Waveform Synthesis)
echo ========================================================
echo.

set "VENV_PY=%~dp0..\FULL APP\.venv\Scripts\python.exe"
if exist "%VENV_PY%" (
    echo Using virtual environment python from FULL APP\.venv...
    "%VENV_PY%" -u -m uvicorn main:app --host 0.0.0.0 --port 8000
) else if exist "%~dp0.venv\Scripts\python.exe" (
    echo Using local .venv python...
    "%~dp0.venv\Scripts\python.exe" -u -m uvicorn main:app --host 0.0.0.0 --port 8000
) else (
    echo Virtual environment not found. Using system python...
    python -u -m uvicorn main:app --host 0.0.0.0 --port 8000
)
