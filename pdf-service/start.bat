@echo off
REM PDF OCR Service Startup Script for Windows

echo 🚀 Starting PDF OCR Service...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.11+ first.
    pause
    exit /b 1
)

echo ✅ Python detected

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Create necessary directories
echo 📁 Creating directories...
if not exist "uploads" mkdir uploads
if not exist "temp" mkdir temp

REM Run tests
echo 🧪 Running tests...
python test_service.py

if %errorlevel% equ 0 (
    echo ✅ Tests passed!
) else (
    echo ⚠️  Some tests failed, but continuing...
)

REM Start the service
echo 🌐 Starting PDF OCR Service...
echo 📚 API Documentation will be available at:
echo    - Swagger UI: http://localhost:8000/docs
echo    - ReDoc: http://localhost:8000/redoc
echo.
echo 🛑 Press Ctrl+C to stop the service
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause 