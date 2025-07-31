@echo off
color 0B
title BitoraBackup Management Console

:main_menu
cls
echo.
echo ====================================================
echo           BitoraBackup Management Console
echo        Database Backup Automation System
echo ====================================================
echo.

if not exist ecosystem.config.js (
    color 0C
    echo [ERROR] SETUP REQUIRED
    echo ----------------------------------------------------
    echo PM2 configuration file not found!
    echo Please run install.bat first to set up BitoraBackup.
    echo.
    echo Press any key to exit...
    pause >nul
    color 07
    exit /b 1
)

echo [INFO] Checking application status...
call pm2 list BitoraBackup 2>nul | findstr "BitoraBackup" >nul
set PM2_RUNNING=%errorlevel%

echo [INFO] Checking configuration file...
if exist config.json (
    echo [INFO] Configuration file found
    set CONFIG_EXISTS=1
) else (
    echo [INFO] No configuration file found
    set CONFIG_EXISTS=0
)

echo.
echo Current Status:
echo ---------------
if %PM2_RUNNING% equ 0 (
    echo [RUNNING] BitoraBackup is active with PM2
    set MENU_TYPE=running
) else (
    if %CONFIG_EXISTS% equ 1 (
        echo [CONFIGURED] Ready to start with existing config
        set MENU_TYPE=configured
    ) else (
        echo [NEEDS CONFIG] Configuration required before starting
        set MENU_TYPE=needs_config
    )
)
echo.

echo ====================================================
echo                   MAIN MENU
echo ====================================================

if "%MENU_TYPE%"=="running" (
    echo [1] Restart Application
    echo [2] Stop Application
    echo [3] View Detailed Status
    echo [4] View Live Logs
    echo [5] View Error Logs
    echo [6] View Recent Activity
    echo [7] Resource Monitor
    echo [8] Reconfigure Settings
    echo [9] Remove from PM2
) else if "%MENU_TYPE%"=="configured" (
    echo [1] Start BitoraBackup
    echo [2] Reconfigure Settings
    echo [3] Test Configuration
    echo [4] View Current Config
    echo [7] PM2 Resource Monitor
) else (
    echo [1] Configure BitoraBackup
    echo [2] View Setup Guide
    echo [3] Check Requirements
)
echo [0] Exit Console
echo ====================================================
echo.

if "%MENU_TYPE%"=="needs_config" (
    echo [TIP] Run option [1] first to configure BitoraBackup
) else if "%MENU_TYPE%"=="configured" (
    echo [TIP] Configuration ready - use option [1] to start
) else (
    echo [TIP] BitoraBackup runs automatically every 12 hours
)

echo.
set /p choice=Select option: 

if "%choice%"=="1" goto option1
if "%choice%"=="2" goto option2
if "%choice%"=="3" goto option3
if "%choice%"=="4" goto option4
if "%choice%"=="5" goto option5
if "%choice%"=="6" goto option6
if "%choice%"=="7" goto option7
if "%choice%"=="8" goto option8
if "%choice%"=="9" goto option9
if "%choice%"=="0" goto exit_app

color 0E
echo.
echo [ERROR] Invalid choice! Please select a valid option
echo.
timeout 2 >nul
color 0B
goto main_menu

:option1
cls
echo.
echo ====================================================
if "%MENU_TYPE%"=="running" (
    echo              Restarting Application
    echo ====================================================
    echo.
    echo [INFO] Stopping current instance...
    call pm2 stop BitoraBackup
    echo [INFO] Starting fresh instance...
    call pm2 start BitoraBackup
    echo.
    if %errorlevel% equ 0 (
        echo [SUCCESS] BitoraBackup restarted successfully
    ) else (
        echo [ERROR] Failed to restart BitoraBackup
    )
) else if "%MENU_TYPE%"=="configured" (
    echo              Starting Application
    echo ====================================================
    echo.
    echo [INFO] Starting BitoraBackup with existing configuration...
    call pm2 start ecosystem.config.js
    echo.
    if %errorlevel% equ 0 (
        echo [SUCCESS] BitoraBackup started successfully
        echo [INFO] Application is now running in background
        echo [INFO] Check Discord for startup notification
    ) else (
        echo [ERROR] Failed to start BitoraBackup
        echo [INFO] Check configuration and try again
    )
) else (
    echo            Configuration Wizard
    echo ====================================================
    echo.
    echo [INFO] Starting BitoraBackup configuration...
    echo.
    echo This wizard will configure:
    echo ---------------------------
    echo - Database connection settings
    echo - Discord webhook for notifications
    echo - GoFile.io upload settings
    echo - Backup schedule preferences
    echo.
    echo [IMPORTANT] After configuration completes:
    echo - Press Ctrl+C to return to this menu
    echo - Then use this menu to start with PM2
    echo.
    echo Press any key to start configuration wizard...
    pause >nul
    echo.
    echo [STARTING] Configuration wizard...
    echo ====================================================
    call node src/app.js
    echo.
    echo ====================================================
    echo [INFO] Configuration wizard completed
    echo [INFO] Return to main menu to start BitoraBackup
    echo.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:option2
cls
echo.
echo ====================================================
if "%MENU_TYPE%"=="running" (
    echo              Stopping Application
    echo ====================================================
    echo.
    echo [INFO] Stopping BitoraBackup...
    call pm2 stop BitoraBackup
    echo.
    if %errorlevel% equ 0 (
        echo [SUCCESS] BitoraBackup stopped successfully
        echo [INFO] Application is no longer running
    ) else (
        echo [ERROR] Failed to stop BitoraBackup
    )
) else if "%MENU_TYPE%"=="configured" (
    echo            Reconfigure Settings
    echo ====================================================
    echo.
    echo [WARNING] This will overwrite existing configuration
    echo.
    set /p confirm=Continue with reconfiguration? (y/N): 
    if /i "%confirm%"=="y" (
        echo.
        echo [INFO] Starting reconfiguration...
        call node src/app.js
        echo.
        echo [INFO] Reconfiguration completed
    ) else (
        echo [CANCELLED] Reconfiguration cancelled
    )
) else (
    echo               Setup Guide
    echo ====================================================
    echo.
    echo BitoraBackup Setup Requirements:
    echo ------------------------------
    echo.
    echo 1. MySQL/MariaDB Database:
    echo    - Database server running
    echo    - User with backup privileges
    echo    - Database name to backup
    echo.
    echo 2. Discord Webhook:
    echo    - Discord server access
    echo    - Webhook URL from server settings
    echo.
    echo 3. GoFile.io Account (Optional):
    echo    - Free: Basic uploads
    echo    - Premium: Full API features
    echo    - API token from profile page
    echo.
    echo 4. Network Access:
    echo    - Internet connection for uploads
    echo    - Access to database server
    echo.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:option3
cls
echo.
echo ====================================================
if "%MENU_TYPE%"=="running" (
    echo              Application Status
    echo ====================================================
    echo.
    echo [INFO] Retrieving detailed status...
    call pm2 describe BitoraBackup
) else if "%MENU_TYPE%"=="configured" (
    echo            Test Configuration
    echo ====================================================
    echo.
    echo [INFO] Testing configuration without starting PM2...
    echo [INFO] This will validate your settings
    echo.
    echo Press any key to start test...
    pause >nul
    call node src/app.js
) else (
    echo            Check Requirements
    echo ====================================================
    echo.
    echo [INFO] Checking system requirements...
    echo.
    echo Node.js version:
    node --version
    echo.
    echo npm version:
    npm --version
    echo.
    echo PM2 status:
    pm2 --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo PM2 is installed
    ) else (
        echo PM2 is NOT installed - run install.bat
    )
    echo.
    echo Required directories:
    if exist src echo [OK] src/ directory exists
    if not exist src echo [MISSING] src/ directory
    if exist logs echo [OK] logs/ directory exists
    if not exist logs echo [MISSING] logs/ directory
    if exist backups echo [OK] backups/ directory exists
    if not exist backups echo [MISSING] backups/ directory
)
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:option4
cls
echo.
echo ====================================================
if "%MENU_TYPE%"=="running" (
    echo                Live Log Stream
    echo ====================================================
    echo.
    echo [INFO] Starting real-time log monitoring...
    echo [INFO] Press Ctrl+C to stop and return to menu
    echo.
    call pm2 logs BitoraBackup
) else if "%MENU_TYPE%"=="configured" (
    echo            View Current Config
    echo ====================================================
    echo.
    if exist config.json (
        echo [INFO] Current configuration:
        echo ====================================================
        type config.json
        echo ====================================================
    ) else (
        echo [ERROR] No configuration file found
    )
)
goto main_menu

:option5
cls
echo.
echo ====================================================
echo                 Error Logs
echo ====================================================
echo.
if exist logs\error.log (
    echo [INFO] Displaying error log contents...
    echo ====================================================
    type logs\error.log
    echo ====================================================
) else (
    echo [SUCCESS] No error logs found!
    echo [INFO] Application is running without errors
)
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:option6
cls
echo.
echo ====================================================
echo              Recent Activity
echo ====================================================
echo.
echo [INFO] Displaying last 30 log entries...
echo ====================================================
call pm2 logs BitoraBackup --lines 30
echo ====================================================
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:option7
cls
echo.
echo ====================================================
echo              Resource Monitor
echo ====================================================
echo.
echo [INFO] Opening PM2 resource monitor...
echo [INFO] Press Ctrl+C to exit monitor and return
echo.
call pm2 monit
goto main_menu

:option8
cls
echo.
echo ====================================================
echo            Reconfigure Settings
echo ====================================================
echo.
echo [WARNING] This will update your current configuration
echo [INFO] The application will need to be restarted
echo.
set /p confirm=Continue with reconfiguration? (y/N): 
if /i "%confirm%"=="y" (
    echo.
    echo [INFO] Stopping application for reconfiguration...
    call pm2 stop BitoraBackup
    echo.
    echo [INFO] Starting configuration wizard...
    call node src/app.js
    echo.
    echo [INFO] Reconfiguration completed
    echo [INFO] Use option [1] to restart the application
) else (
    echo [CANCELLED] Reconfiguration cancelled
)
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:option9
cls
echo.
echo ====================================================
echo            Remove from PM2
echo ====================================================
echo.
color 0E
echo [WARNING] This will completely remove BitoraBackup from PM2
echo [WARNING] All monitoring and auto-restart will stop
echo.
echo This action will:
echo -----------------
echo - Stop the application
echo - Remove from PM2 process list
echo - Require manual restart using option [1]
echo.
set /p confirm=Type 'YES' to confirm removal: 
if /i "%confirm%"=="YES" (
    color 0B
    echo.
    echo [INFO] Removing BitoraBackup from PM2...
    call pm2 delete BitoraBackup
    echo.
    echo [SUCCESS] BitoraBackup removed from PM2
    echo [INFO] Use option [1] to start it again when needed
) else (
    color 0B
    echo.
    echo [CANCELLED] Operation cancelled - no changes made
)
echo.
echo Press any key to return to main menu...
pause >nul
goto main_menu

:exit_app
cls
echo.
echo ====================================================
echo                    Goodbye!
echo ====================================================
echo.
echo [INFO] BitoraBackup Management Console closing...
echo.
if %PM2_RUNNING% equ 0 (
    echo Important reminders:
    echo --------------------
    echo - BitoraBackup continues running in the background
    echo - Automatic backups occur every 12 hours
    echo - Check your Discord for backup notifications
    echo - Backup files are stored in the backups/ folder
) else (
    echo Note:
    echo -----
    echo - BitoraBackup is currently not running
    echo - Use this console to start it when ready
    echo - Configuration is saved for future use
)
echo.
echo [INFO] Thank you for using BitoraBackup!
echo.
echo Exiting in 3 seconds...
timeout 3 >nul
color 07