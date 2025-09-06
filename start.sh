#!/bin/bash
# Start script for Real Estate Manager on Render.com

echo "🚀 Starting Real Estate Manager..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🐍 Python version: $python_version"

# Install requirements if needed
if [ -f "requirements.txt" ]; then
    echo "📦 Installing requirements..."
    pip3 install -r requirements.txt
fi

# Set environment variables
export PORT=${PORT:-8000}
export NODE_ENV=${NODE_ENV:-production}

echo "🌐 Port: $PORT"
echo "🔧 Environment: $NODE_ENV"

# Start the server
echo "🎯 Starting server..."
python3 server.py