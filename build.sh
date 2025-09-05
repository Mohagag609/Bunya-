#!/bin/bash

echo "🚀 Starting build process..."

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

echo "✅ Build completed successfully!"