#!/bin/bash

# Docker Build Verification Script
# This script helps verify that the Docker setup is working correctly

set -e

echo "========================================="
echo "CarbonControl Docker Build Verification"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed: $(docker --version)"
echo ""

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found in current directory"
    exit 1
fi

echo "✅ Dockerfile found"
echo ""

# Build the image
echo "🔨 Building Docker image..."
echo "This may take several minutes..."
echo ""

if docker build -t carboncontrol:latest .; then
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
else
    echo ""
    echo "❌ Docker build failed. Please check the error messages above."
    exit 1
fi

# Show image details
echo "📦 Image details:"
docker images carboncontrol:latest
echo ""

# Ask user if they want to run the container
read -p "Do you want to run the container now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting container on port 3000..."
    echo ""
    
    # Stop and remove existing container if it exists
    docker stop carboncontrol 2>/dev/null || true
    docker rm carboncontrol 2>/dev/null || true
    
    # Run the container
    docker run -d --name carboncontrol -p 3000:3000 carboncontrol:latest
    
    echo "✅ Container started!"
    echo ""
    echo "📍 Access the application at: http://localhost:3000"
    echo ""
    echo "To view logs: docker logs -f carboncontrol"
    echo "To stop: docker stop carboncontrol"
    echo "To remove: docker rm carboncontrol"
else
    echo "👍 You can run the container later with:"
    echo "docker run -p 3000:3000 carboncontrol:latest"
fi

echo ""
echo "========================================="
echo "Verification complete!"
echo "========================================="
