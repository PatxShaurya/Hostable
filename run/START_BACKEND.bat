@echo off
title Hostel Mess Management Server Console
color 0A
cd /d "%~dp0..\backend"
echo =======================================================
echo Starting Hostel & Mess Management Backend API...
echo =======================================================
set "NODE_PATH=C:\Program Files\nodejs\node.exe"
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node server.js
) else if exist "%NODE_PATH%" (
    "%NODE_PATH%" server.js
) else (
    echo Error: Node.js not detected.
    pause
)
