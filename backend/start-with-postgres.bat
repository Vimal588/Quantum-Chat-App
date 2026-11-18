@echo off
title QuantumChat - PostgreSQL Backend Launcher
echo ==========================================================
echo  QuantumChat: Connecting to Local PostgreSQL (Port 5432)
echo ==========================================================

REM Set default credentials (override if different)
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=quantum_chat_db
set DB_USERNAME=postgres
if "%DB_PASSWORD%"=="" set DB_PASSWORD=Vimal@2006
set PGPASSWORD=%DB_PASSWORD%

REM Check if PostgreSQL is running
netstat -ano | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo [!] PostgreSQL service is not running on port 5432.
    echo [*] Attempting to start service 'postgresql-x64-18'...
    net start postgresql-x64-18
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Could not start PostgreSQL service automatically.
        echo Please right-click Command Prompt, choose 'Run as Administrator', and run:
        echo   net start postgresql-x64-18
        echo Or start it via Windows Services (services.msc).
        echo.
        pause
        exit /b 1
    )
)

echo [+] PostgreSQL service is active on port 5432.

REM Create database if psql exists
if exist "C:\Program Files\PostgreSQL\18\bin\createdb.exe" (
    echo [*] Ensuring database '%DB_NAME%' exists...
    "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U %DB_USERNAME% -h %DB_HOST% -p %DB_PORT% %DB_NAME% 2>nul
)

echo.
echo [*] Starting Spring Boot application connected to PostgreSQL...
echo     URL:  jdbc:postgresql://%DB_HOST%:%DB_PORT%/%DB_NAME%
echo     USER: %DB_USERNAME%
echo ==========================================================
echo.

mvn spring-boot:run
pause
