# Zarai Mandi Full-Stack Launcher (PowerShell)
$WorkspaceRoot = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Starting Zarai Mandi (Backend + Frontend)" -ForegroundColor Green
Write-Host "  TTS Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend Web UI: http://localhost:8445" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green

if (Test-Path "$WorkspaceRoot\node_modules\.bin\concurrently.cmd") {
    npm run dev
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceRoot\backend'; & '..\app\.venv\Scripts\uvicorn.exe' main:app --host 0.0.0.0 --port 8000"
    Set-Location "$WorkspaceRoot\app"
    npm run dev
}
