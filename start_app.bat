@echo off
title AIVOA.AI RCA Module Launcher
echo ============================================================
echo    AIVOA.AI - Root Cause Analysis (RCA) Module Launcher
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python FastAPI Backend on http://localhost:8000...
start "AIVOA Backend (FastAPI)" powershell -NoExit -Command "cd '%~dp0backend'; $env:PYTHONPATH='%~dp0backend'; & '%~dp0backend\venv\Scripts\python.exe' -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "AIVOA Frontend (Vite)" powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev -- --host"

echo.
echo ============================================================
echo Frontend Application: http://localhost:5173
echo Backend API Docs:    http://localhost:8000/docs
echo Sample Incident PDF: backend\sample_data\sample_incident.pdf
echo ============================================================
echo.
pause

