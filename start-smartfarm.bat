@echo off
title SmartFarm AI - Professor Presentation Launcher
echo ============================================================
echo   SmartFarm AI - Precision Agriculture Platform Launcher
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Ensuring Database is Seeded with Demo Data...
call npm run seed
echo.

echo [2/3] Starting Python Crop Disease Vision AI Service (Port 8000)...
start "SmartFarm AI - Python Disease Service" cmd /k "cd services\disease-service && python -m uvicorn main:app --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak > nul
echo.

echo [3/3] Starting Next.js Web Application (Port 3000)...
start "SmartFarm AI - Web Portal" cmd /k "npm run dev"
timeout /t 4 /nobreak > nul
echo.

echo ============================================================
echo   SmartFarm AI is now running!
echo   Web Portal:        http://localhost:3000
echo   Disease AI API:    http://127.0.0.1:8000/health
echo.
echo   Demo Logins:
echo     Farmer:  farmer@smartfarm.ai  /  farmer123456
echo     Admin:   admin@smartfarm.ai   /  admin123456
echo.
echo   Sample Leaf Images for Diagnosis Demo:
echo     Located in: %~dp0samples
echo.
echo   To simulate live IoT sensor readings during demo, run:
echo     node scripts/simulate-iot.mjs --scenario=dry_to_wet --count=2
echo ============================================================
echo.

start http://localhost:3000
