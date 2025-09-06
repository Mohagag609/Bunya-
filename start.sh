#!/bin/bash

# Simple startup script for Render
echo "🚀 Starting Estate Manager on Render..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Initialize database
echo "🗄️ Initializing database..."
cd backend
python -m flask --app server:app init-db

# Start the application
echo "🌐 Starting application..."
python server.py