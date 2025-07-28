#!/bin/bash

echo "========================================"
echo "CarbonControl Setup Script for Linux"
echo "========================================"
echo

# Check if Node.js is installed
echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js first:"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    echo "  Or download from: https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi
echo "✓ Node.js is installed ($(node --version))"

# Check if we're in the right directory
echo
echo "[2/5] Checking project structure..."
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    echo "Please run this script from the CarbonControl directory."
    exit 1
fi
echo "✓ Project structure looks good"

# Install dependencies
echo
echo "[3/5] Installing dependencies..."
echo "This may take a few minutes..."
if npm install; then
    echo "✓ Dependencies installed successfully"
else
    echo "Trying with pnpm..."
    if command -v pnpm &> /dev/null; then
        if pnpm install; then
            echo "✓ Dependencies installed successfully with pnpm"
        else
            echo "ERROR: Failed to install dependencies with both npm and pnpm!"
            exit 1
        fi
    else
        echo "ERROR: Failed to install dependencies and pnpm is not available!"
        exit 1
    fi
fi

# Build the project
echo
echo "[4/5] Building the project..."
if npm run build; then
    echo "✓ Project built successfully"
else
    echo "WARNING: Build failed, but continuing..."
    echo "You can still run the development server."
fi

# Start the development server
echo
echo "[5/5] Starting development server..."
echo
echo "========================================"
echo "🎉 CarbonControl is ready!"
echo "========================================"
echo
echo "The UI will open in your browser at: http://localhost:3000"
echo
echo "Features available:"
echo "✓ UDP Discovery for automatic printer finding"
echo "✓ IP Address caching between sessions"
echo "✓ Real-time printer control"
echo "✓ File upload and management"
echo "✓ Live camera feed"
echo
echo "Press Ctrl+C to stop the server"
echo
npm run dev 