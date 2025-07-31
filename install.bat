@echo off
color 0A
title BitoraBackup Installation

cls
echo.
echo ====================================================
echo              BitoraBackup Installer
echo            Automated MySQL Backup
echo ====================================================
echo.
echo Starting installation process...
echo.
timeout 2 >nul

cls
echo.
echo ====================================================
echo                   STEP 1 of 5
echo          Installing Node.js Dependencies
echo ====================================================
echo.
echo [INFO] Running: npm install
echo [INFO] This may take a few minutes...
echo.
call npm install
echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Dependencies installed successfully
    echo [INFO] Found and installed all required packages
) else (
    echo [ERROR] Failed to install dependencies
    echo [INFO] Try running this script as Administrator
)
echo.
echo Press any key to continue to next step...
pause >nul

cls
echo.
echo ====================================================
echo                   STEP 2 of 5
echo          Installing PM2 Process Manager
echo ====================================================
echo.
echo [INFO] Running: npm install -g pm2
echo [INFO] PM2 manages background processes
echo.
call npm install -g pm2
echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] PM2 installed successfully
    echo [INFO] PM2 is now available globally
) else (
    echo [ERROR] Failed to install PM2
    echo [INFO] Try running this script as Administrator
)
echo.
echo Press any key to continue to next step...
pause >nul

cls
echo.
echo ====================================================
echo                   STEP 3 of 5
echo           Creating Required Directories
echo ====================================================
echo.
echo [INFO] Creating application directories...
echo.
if not exist logs (
    mkdir logs
    echo [CREATED] logs/ directory for application logs
) else (
    echo [EXISTS] logs/ directory already exists
)

if not exist backups (
    mkdir backups
    echo [CREATED] backups/ directory for database backups
) else (
    echo [EXISTS] backups/ directory already exists
)
echo.
echo [SUCCESS] All directories are ready
echo.
echo Press any key to continue to next step...
pause >nul

cls
echo.
echo ====================================================
echo                   STEP 4 of 5
echo          Generating PM2 Configuration
echo ====================================================
echo.
echo [INFO] Creating ecosystem.config.js file...
echo.
echo module.exports = { > ecosystem.config.js
echo   apps: [{ >> ecosystem.config.js
echo     name: "BitoraBackup", >> ecosystem.config.js
echo     script: "./src/app.js", >> ecosystem.config.js
echo     instances: 1, >> ecosystem.config.js
echo     autorestart: true, >> ecosystem.config.js
echo     watch: false, >> ecosystem.config.js
echo     max_memory_restart: "500M", >> ecosystem.config.js
echo     error_file: "./logs/error.log", >> ecosystem.config.js
echo     out_file: "./logs/output.log", >> ecosystem.config.js
echo     log_file: "./logs/combined.log", >> ecosystem.config.js
echo     time: true >> ecosystem.config.js
echo   }] >> ecosystem.config.js
echo }; >> ecosystem.config.js
echo.
echo [SUCCESS] PM2 configuration file created
echo [INFO] Configuration file: ecosystem.config.js
echo.
echo Press any key to continue to final step...
pause >nul

cls
echo.
echo ====================================================
echo                   STEP 5 of 5
echo              Installation Summary
echo ====================================================
echo.
echo [COMPLETE] Installation finished successfully!
echo.
echo Components installed:
echo ----------------------
echo [OK] Node.js dependencies
echo [OK] PM2 process manager
echo [OK] Application directories
echo [OK] PM2 configuration file
echo.
echo Files created:
echo --------------
echo - ecosystem.config.js  (PM2 configuration)
echo - logs/                (Application logs)
echo - backups/             (Database backups)
echo.
echo Next steps:
echo -----------
echo 1. Run: run.bat
echo 2. Follow the configuration wizard
echo 3. BitoraBackup will start automatically
echo.
echo Installation complete! Press any key to exit...
pause >nul

color 07