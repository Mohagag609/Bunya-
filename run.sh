#!/bin/bash

# Main startup script for Estate Manager
# This script handles both local development and production deployment

set -e

echo "🏛️ Starting Estate Manager..."
echo "================================"

# Check if we're in production (Render)
if [ "$RENDER" = "true" ]; then
    echo "🚀 Production mode detected (Render)"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    
    # Run database initialization
    echo "🗄️ Initializing database..."
    cd backend
    python -m flask --app server:app init-db
    cd ..
    
    # Start Gunicorn server
    echo "🌐 Starting Gunicorn server..."
    gunicorn backend.server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
else
    echo "💻 Development mode detected"
    
    # Install dependencies if needed
    if [ ! -d "venv" ]; then
        echo "📦 Creating virtual environment..."
        python -m venv venv
    fi
    
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    
    # Start Flask development server
    echo "🌐 Starting Flask development server..."
    cd backend
    python server.py
fi