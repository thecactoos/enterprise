@echo off
REM Test script for PDF service Docker build (Windows)

echo 🧪 Testing PDF Service Docker Build...

REM Build the Docker image
echo 🔨 Building Docker image...
docker build -t pdf-ocr-service .

if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker build successful!
    
    REM Test running the container
    echo 🚀 Testing container startup...
    docker run -d --name pdf-service-test -p 8000:8000 pdf-ocr-service
    
    REM Wait a moment for the service to start
    timeout /t 10 /nobreak >nul
    
    REM Test health endpoint
    echo 🏥 Testing health endpoint...
    curl -f http://localhost:8000/health
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Health check passed!
        
        REM Test OCR config endpoint
        echo 🔧 Testing OCR config endpoint...
        curl -f http://localhost:8000/api/v1/ocr/config
        
        if %ERRORLEVEL% EQU 0 (
            echo ✅ OCR config endpoint working!
        ) else (
            echo ❌ OCR config endpoint failed
        )
    ) else (
        echo ❌ Health check failed
    )
    
    REM Clean up
    echo 🧹 Cleaning up test container...
    docker stop pdf-service-test
    docker rm pdf-service-test
    
) else (
    echo ❌ Docker build failed!
    exit /b 1
)

echo 🎉 Docker build test completed! 