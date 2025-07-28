@echo off
echo ========================================
echo CarbonControl Setup Script for Windows
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)
echo ✓ Node.js is installed

REM Check if we're in the right directory
echo.
echo [2/5] Checking project structure...
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the CarbonControl directory.
    pause
    exit /b 1
)
echo ✓ Project structure looks good

REM Install dependencies
echo.
echo [3/5] Installing dependencies...
echo This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo Trying with pnpm...
    call pnpm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies with both npm and pnpm!
        pause
        exit /b 1
    )
)
echo ✓ Dependencies installed successfully

REM Build the project
echo.
echo [4/5] Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo WARNING: Build failed, but continuing...
    echo You can still run the development server.
)

REM Start the development server
echo.
echo [5/5] Starting development server...
echo.
echo ========================================
echo 🎉 CarbonControl is ready!
echo ========================================
echo.
echo The UI will open in your browser at: http://localhost:3000
echo.
echo Features available:
echo ✓ UDP Discovery for automatic printer finding
echo ✓ IP Address caching between sessions
echo ✓ Real-time printer control
echo ✓ File upload and management
echo ✓ Live camera feed
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev 