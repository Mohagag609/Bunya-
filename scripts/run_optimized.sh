#!/bin/bash

# Enhanced startup script for Estate Manager
# This script includes database optimization and health checks

set -e

echo "🏗️  Starting Estate Manager with optimizations..."

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r backend/requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python -m flask --app backend.server:app init-db

# Optimize database (add indexes and constraints)
echo "⚡ Optimizing database..."
python backend/optimize_db.py

# Health check
echo "🏥 Running health check..."
python -c "
import requests
import time
import sys

# Start the server in background
import subprocess
import os
os.chdir('/workspace')
server = subprocess.Popen(['python', 'backend/server.py'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# Wait for server to start
time.sleep(5)

try:
    response = requests.get('http://localhost:8000/health', timeout=10)
    if response.status_code == 200:
        print('✅ Health check passed')
        print(f'Server status: {response.json()}')
    else:
        print(f'❌ Health check failed: {response.status_code}')
        sys.exit(1)
except Exception as e:
    print(f'❌ Health check error: {e}')
    sys.exit(1)
finally:
    server.terminate()
"

echo "🚀 Starting production server..."
gunicorn backend.server:app --config gunicorn.conf.py