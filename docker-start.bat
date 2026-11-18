@echo off
title QuantumChat - Docker Compose Launcher
echo ===================================================================
echo   QuantumChat: Starting Full-Stack Multi-Container Environment
echo ===================================================================
echo.

REM Check if docker command is available
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not found in your system PATH.
    echo Please install and start Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo [*] Building and launching containers via Docker Compose...
echo     - PostgreSQL Database (Port 5432)
echo     - Spring Boot Backend (Port 8080)
echo     - React + Nginx Web Frontend (Port 80 and 5173)
echo.

docker compose --env-file .env.docker up --build -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Compose failed to start the containers.
    echo Make sure Docker Desktop is running.
    echo.
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo   QuantumChat is running successfully!
echo ===================================================================
echo   - Web Frontend:  http://localhost
echo   - Alternate URL: http://localhost:5173
echo   - REST API:      http://localhost:8080/api
echo   - PostgreSQL:    localhost:5432 (quantum_chat_db)
echo ===================================================================
echo.
echo View live logs by running: docker compose logs -f
echo Stop containers by running: docker-stop.bat
echo.
pause
