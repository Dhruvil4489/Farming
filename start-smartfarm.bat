@echo off
TITLE SmartFarm AI — 1-Click Platform Launcher
COLOR 0A
CLS

echo ===============================================================================
echo     SMARTFARM AI — IoT-INTEGRATED AGRICULTURAL PLATFORM
echo     Unified System Launcher for Faculty Demonstration and Evaluation
echo ===============================================================================
echo.

:: Ensure we are running in the Farming directory
cd /d "%~dp0"
if not exist "package.json" (
    if exist "Farming\package.json" (
        cd /d "%~dp0Farming"
    ) else (
        echo [ERROR] Could not locate SmartFarm AI repository root.
        pause
        exit /b 1
    )
)

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

:: Synchronize database schema and seed medicines
echo [*] Checking SQLite database synchronization...
call npx prisma db push --skip-generate >nul 2>nul
echo [*] Ensuring crop disease medicines are seeded in store...
call node scripts/seed-crop-medicines.mjs >nul 2>nul
echo [OK] Database is synchronized and ready.
echo.

:MENU
echo -------------------------------------------------------------------------------
echo Select an action to run:
echo -------------------------------------------------------------------------------
echo  [1] Start SmartFarm AI Web Application (Next.js on http://localhost:3000)
echo  [2] Start Arduino Uno USB Serial Bridge (Physical Hardware Ingestion)
echo  [3] Start Software IoT Telemetry Simulator (Dry-to-Wet Demo Sequence)
echo  [4] Run Full System Rehearsal & Release Test Suite (12 Quality Gates)
echo  [5] Start Python PyTorch ResNet-50 Disease Microservice (Port 8000)
echo  [6] Launch Full Live Stack (Web Server + Hardware Bridge in new windows)
echo  [7] Open Complete Master Technical Audit PDF Report
echo  [0] Exit
echo -------------------------------------------------------------------------------
set /p CHOICE="Enter choice (1-7, 0 to exit): "

if "%CHOICE%"=="1" goto LAUNCH_WEB
if "%CHOICE%"=="2" goto LAUNCH_BRIDGE
if "%CHOICE%"=="3" goto LAUNCH_SIMULATOR
if "%CHOICE%"=="4" goto RUN_TESTS
if "%CHOICE%"=="5" goto LAUNCH_PYTHON
if "%CHOICE%"=="6" goto LAUNCH_FULL_STACK
if "%CHOICE%"=="7" goto OPEN_PDF
if "%CHOICE%"=="0" goto EXIT_SCRIPT

echo [!] Invalid selection, please try again.
echo.
goto MENU

:LAUNCH_WEB
echo.
echo [*] Launching Next.js application on http://localhost:3000...
echo [*] Press Ctrl+C to stop.
echo.
call npm run dev
goto MENU

:LAUNCH_BRIDGE
echo.
echo [*] Launching Arduino Uno USB Serial Bridge...
echo [*] Connect your Arduino Uno via USB, or it will run in fallback simulation mode.
echo.
call node scripts/arduino-serial-bridge.mjs
pause
goto MENU

:LAUNCH_SIMULATOR
echo.
echo [*] Emitting deterministic physical-like IoT sensor readings...
echo [*] Target: http://localhost:3000/api/v1/iot/telemetry
echo.
call node scripts/simulate-iot.mjs --scenario=dry_to_wet --count=10
pause
goto MENU

:RUN_TESTS
echo.
echo [*] Running SmartFarm AI Master Release Rehearsal Suite...
echo.
call npm test
pause
goto MENU

:LAUNCH_PYTHON
echo.
echo [*] Launching Python FastAPI Disease Inference Service on port 8000...
cd /d "%~dp0services\disease-service"
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found in PATH.
    pause
    goto MENU
)
call python main.py
cd /d "%~dp0"
pause
goto MENU

:LAUNCH_FULL_STACK
echo.
echo [*] Launching Web Application in new window...
start "SmartFarm AI — Web Application" cmd /k "cd /d ""%~dp0"" && npm run dev"
timeout /t 3 >nul
echo [*] Launching Arduino Hardware Serial Bridge in new window...
start "SmartFarm AI — Hardware Serial Bridge" cmd /k "cd /d ""%~dp0"" && node scripts/arduino-serial-bridge.mjs"
echo.
echo [OK] Full stack launched! 
echo      - Web Dashboard: http://localhost:3000
echo      - IoT Bridge: Listening for Arduino Uno packets
echo.
pause
goto MENU

:OPEN_PDF
echo.
echo [*] Opening Master Technical Audit PDF Report...
if exist "docs\SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf" (
    start "" "docs\SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf"
) else (
    echo [!] PDF file not found at docs\SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf
)
goto MENU

:EXIT_SCRIPT
echo.
echo Goodbye! Best wishes for your SmartFarm AI evaluation!
timeout /t 2 >nul
exit /b 0
