@echo off
title BitoraBackup

echo Starting BitoraBackup...

if not exist ecosystem.config.js (
    echo ERROR: PM2 config not found
    echo Please run install.bat first
    pause
    exit /b 1
)

pm2 list | findstr "BitoraBackup" >nul 2>&1
if %errorlevel% equ 0 (
    echo BitoraBackup is already running
    echo [1] Restart  [2] Stop  [3] Status  [4] Logs  [5] Exit
    set /p choice=Choose: 
    if "%choice%"=="1" pm2 restart BitoraBackup
    if "%choice%"=="2" pm2 stop BitoraBackup
    if "%choice%"=="3" pm2 status BitoraBackup
    if "%choice%"=="4" pm2 logs BitoraBackup --lines 20
    pause
    goto end
)

echo Starting configuration...
node src/app.js

echo Starting with PM2...
pm2 start ecosystem.config.js

pm2 status BitoraBackup
pause

:end
echo Goodbye