@echo off
echo 🏛️ Starting Estate Manager - مدير الاستثمار العقاري
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Database Configuration
        echo DATABASE_URL=postgresql://neondb_owner:npg_7NGtZKAk8BCU@ep-polished-glitter-adyad3gu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
        echo.
        echo # Flask Configuration
        echo FLASK_ENV=development
        echo FLASK_DEBUG=True
        echo.
        echo # Application Configuration
        echo APP_NAME=Estate Manager
        echo APP_VERSION=2.0.0
    ) > .env
)

REM Start backend server
echo 🚀 Starting backend server...
cd backend
start "Backend Server" cmd /k "venv\Scripts\activate && python server.py"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend development server
echo 🚀 Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo ✅ Estate Manager is running!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 📊 API Health: http://localhost:8000/api/health
echo.
echo Press any key to exit...
pause >nul