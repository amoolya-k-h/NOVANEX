# RepoGuard AI - Local Launch Script for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting RepoGuard AI Platform        " -ForegroundColor Cyan
Write-Host "   Detect. Explain. Fix. Verify.          " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start Backend in a dedicated window
Write-Host ""
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$backendCmd = "cd '$root\backend'; Write-Host 'Starting RepoGuard AI Backend...' -ForegroundColor Cyan; & '.\venv\Scripts\uvicorn.exe' app.main:app --host 127.0.0.1 --port 8000 --reload"
$backendProcess = Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru

# 2. Start Frontend in a dedicated window
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:3000..." -ForegroundColor Green
$frontendCmd = "cd '$root\frontend'; Write-Host 'Starting RepoGuard AI Frontend...' -ForegroundColor Cyan; npm run dev"
$frontendProcess = Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $frontendCmd -PassThru

Write-Host ""
Write-Host "[OK] RepoGuard AI is starting up!" -ForegroundColor Cyan
Write-Host "  - Frontend Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend Swagger UI: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  - Demo Test Archive:  $root\test-vulnerable-repo.zip" -ForegroundColor White
Write-Host ""
Write-Host "Both servers are running in their respective windows." -ForegroundColor Green
Write-Host "To stop them, simply close their terminal windows." -ForegroundColor Gray
