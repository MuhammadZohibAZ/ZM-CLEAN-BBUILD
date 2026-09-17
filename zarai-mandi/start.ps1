# Zarai Mandi Full-Stack Launcher (PowerShell)
$WorkspaceRoot = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Starting Zarai Mandi (TTS Backend + Market API + Frontend)" -ForegroundColor Green
Write-Host "  TTS Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Market API:      http://localhost:8090" -ForegroundColor Cyan
Write-Host "  Frontend Web UI: http://localhost:8445" -ForegroundColor Cyan
Write-Host "  (Market API needs Postgres running -- see api/README.md)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green

if (Test-Path "$WorkspaceRoot\node_modules\.bin\concurrently.cmd") {
    npm run dev
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceRoot\backend'; & '..\app\.venv\Scripts\uvicorn.exe' main:app --host 0.0.0.0 --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceRoot\api'; npm run start"
    Set-Location "$WorkspaceRoot\app"
    npm run dev
}
