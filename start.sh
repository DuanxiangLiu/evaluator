#!/bin/bash
# EDA Algorithm Evaluator - Development Server Startup Script
# Works with Git Bash on Windows

echo "Starting EDA Algorithm Evaluator..."
echo "=================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Node.js path for Windows (Git Bash format)
NODE_PATH="/c/Program Files/nodejs"
export PATH="$NODE_PATH:$PATH"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start Vite development server
echo "Starting Vite dev server..."
node ./node_modules/vite/bin/vite.js
