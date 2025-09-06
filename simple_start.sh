#!/bin/bash

# Simple startup script for Render (without database init)
echo "🚀 Starting Estate Manager on Render..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Start the application directly
echo "🌐 Starting application..."
cd backend
python server.py