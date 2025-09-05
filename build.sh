#!/bin/bash

# Build script for Render deployment
# This script handles Python 3.11 compatibility

set -e

echo "🚀 Starting build process for Estate Manager..."

# Upgrade pip first
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements for Python 3.11
echo "📦 Installing requirements for Python 3.11..."
pip install -r requirements-py311.txt

# Test database connection
echo "🔌 Testing database connection..."
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

from backend.server import app, db

with app.app_context():
    try:
        result = db.session.execute('SELECT 1 as test').fetchone()
        print('✅ Database connection successful!')
        print(f'Test result: {result[0]}')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        exit(1)
"

# Run database optimization
echo "⚡ Running database optimization..."
python backend/optimize_db.py

echo "✅ Build completed successfully!"