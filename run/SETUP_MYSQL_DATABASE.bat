@echo off
title Setup MySQL Database (Hostel & Mess Management)
color 0E

echo ==============================================================================
echo           IMPORT SCHEMA AND DATA INTO MYSQL SERVER (DA2)
echo ==============================================================================
echo.
echo This script imports database\init.sql into your local MySQL server.
echo.
set /p MYSQL_PWD="Enter your MySQL root password (leave blank if none): "

echo.
echo [1/2] Connecting and executing database\init.sql...
if "%MYSQL_PWD%"=="" (
    mysql -u root < "%~dp0..\database\init.sql"
) else (
    mysql -u root -p%MYSQL_PWD% < "%~dp0..\database\init.sql"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo [SUCCESS] Database 'hostel_mess_management' successfully created and populated!
    echo All 17 tables, views, triggers, functions, and procedures are active.
    echo ==============================================================================
) else (
    echo.
    echo [ERROR] Import failed. Please check your MySQL credentials or service status.
)

echo.
pause
