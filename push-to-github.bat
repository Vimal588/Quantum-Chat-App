@echo off
title QuantumChat - Push to GitHub
echo ===================================================================
echo   QuantumChat: Add Entire Project Folder to GitHub Repository
echo ===================================================================
echo.

set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/user/quantum-chat.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No repository URL entered. Exiting.
    pause
    exit /b 1
)

echo.
echo [*] Initializing Git repository...
git init

echo [*] Staging all project files (ignoring node_modules and target)...
git add .

echo [*] Committing files...
git commit -m "Initial commit: Quantum-Resistant Chat Application with PQC and Docker"

echo [*] Setting branch to main...
git branch -M main

echo [*] Connecting remote repository...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [*] Pushing files to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [NOTE] If push failed due to remote README already existing on GitHub,
    echo attempting rebase pull and retry...
    git pull origin main --rebase
    git push -u origin main
)

echo.
echo ===================================================================
echo   Successfully pushed entire project to GitHub!
echo ===================================================================
pause
