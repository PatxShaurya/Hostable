@echo off
title HOSTEL & MESS MANAGEMENT SYSTEM (RDBMS LAB - MUJ) - LAUNCHER
color 0B

echo ==============================================================================
echo       HOSTEL & MESS MANAGEMENT SYSTEM (RDBMS LAB - MUJ)
echo       Students: Shaurya Pathak (2502051505), Vaibhav Saxena (2502052896)
echo ==============================================================================
echo.
echo [1/3] Checking environment & Node.js runtime...

set "NODE_PATH=C:\Program Files\nodejs\node.exe"
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "NODE_CMD=node"
) else if exist "%NODE_PATH%" (
    set "NODE_CMD=%NODE_PATH%"
) else (
    echo [ERROR] Node.js executable was not found.
    echo Please install Node.js LTS or ensure it is added to your PATH.
    pause
    exit /b 1
)

echo [2/3] Starting backend server in background...
cd /d "%~dp0..\backend"
start "Hostel Mess Management API Server" /min "%NODE_CMD%" server.js

echo [3/3] Waiting for server to initialize...
timeout /t 2 /nobreak >nul

echo.
echo ==============================================================================
echo [SUCCESS] Directing you to the application dashboard in your default browser...
echo URL: http://localhost:4000
echo ==============================================================================
echo.

start "" "http://localhost:4000"

exit
