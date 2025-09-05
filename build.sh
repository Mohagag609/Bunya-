#!/bin/bash

# Build script for Estate Manager Frontend
echo "🏗️ Building Estate Manager Frontend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output: ./dist"
else
    echo "❌ Build failed!"
    exit 1
fi