# EDA Algorithm Evaluator - Development Server Startup Script (PowerShell)

Write-Host "Starting EDA Algorithm Evaluator..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Set Node.js path
$env:Path = "C:\Program Files\nodejs;$env:Path"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Vite development server
Write-Host "Starting Vite dev server..." -ForegroundColor Green
& "C:\Program Files\nodejs\node.exe" ./node_modules/vite/bin/vite.js
