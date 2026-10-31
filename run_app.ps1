# AIVOA.AI RCA Module - Local Launcher Script
Write-Host "============================================================"
Write-Host "   AIVOA.AI - Root Cause Analysis (RCA) Module Launcher    "
Write-Host "============================================================"

$WorkspaceRoot = $PSScriptRoot
$BackendDir = Join-Path $WorkspaceRoot "backend"
$FrontendDir = Join-Path $WorkspaceRoot "frontend"
$PythonExe = Join-Path $BackendDir "venv\Scripts\python.exe"

# 1. Start Backend in separate window
Write-Host ""
Write-Host "[1/2] Starting Python FastAPI Backend on http://localhost:8000..."
$BackendCmd = "cd '$BackendDir'; `$env:PYTHONPATH='$BackendDir'; & '$PythonExe' -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd

# 2. Start Frontend in separate window
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..."
$FrontendCmd = "cd '$FrontendDir'; npm run dev -- --host"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd

Write-Host ""
Write-Host "All services launched!"
Write-Host "Frontend:  http://localhost:5173"
Write-Host "Backend:   http://localhost:8000"
Write-Host "API Docs:  http://localhost:8000/docs"
Write-Host "Sample PDF available at: backend\sample_data\sample_incident.pdf"
