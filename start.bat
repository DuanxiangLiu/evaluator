@echo off
REM EDA Algorithm Evaluator - Development Server Startup Script (Windows)

echo Starting EDA Algorithm Evaluator...
echo ==================================

REM Set Node.js path
set NODE_PATH=C:\Program Files\nodejs
set PATH=%NODE_PATH%;%PATH%

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start Vite development server
echo Starting Vite dev server...
call "%NODE_PATH%\node.exe" ./node_modules/vite/bin/vite.js

pause
