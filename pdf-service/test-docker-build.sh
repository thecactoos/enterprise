#!/bin/bash

# Test script for PDF service Docker build
echo "🧪 Testing PDF Service Docker Build..."

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t pdf-ocr-service .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # Test running the container
    echo "🚀 Testing container startup..."
    docker run -d --name pdf-service-test -p 8000:8000 pdf-ocr-service
    
    # Wait a moment for the service to start
    sleep 10
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    curl -f http://localhost:8000/health
    
    if [ $? -eq 0 ]; then
        echo "✅ Health check passed!"
        
        # Test OCR config endpoint
        echo "🔧 Testing OCR config endpoint..."
        curl -f http://localhost:8000/api/v1/ocr/config
        
        if [ $? -eq 0 ]; then
            echo "✅ OCR config endpoint working!"
        else
            echo "❌ OCR config endpoint failed"
        fi
    else
        echo "❌ Health check failed"
    fi
    
    # Clean up
    echo "🧹 Cleaning up test container..."
    docker stop pdf-service-test
    docker rm pdf-service-test
    
else
    echo "❌ Docker build failed!"
    exit 1
fi

echo "🎉 Docker build test completed!" 