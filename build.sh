#!/bin/bash

echo "🔧 Building Real Estate Manager..."

# Install requirements
echo "📦 Installing Python packages..."
pip install -r requirements-simple.txt

# Check if psycopg2 is installed
echo "🔍 Checking psycopg2 installation..."
python3 -c "import psycopg2; print('✅ psycopg2 installed successfully')" || {
    echo "❌ psycopg2 installation failed"
    echo "🔄 Trying alternative installation..."
    pip install psycopg2-binary --force-reinstall
}

# Check if flask is installed
echo "🔍 Checking Flask installation..."
python3 -c "import flask; print('✅ Flask installed successfully')" || {
    echo "❌ Flask installation failed"
    exit 1
}

# Test database connection
echo "🔍 Testing database connection..."
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
import psycopg2
try:
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    print('✅ Database connection successful')
    conn.close()
except Exception as e:
    print(f'⚠️ Database connection failed: {e}')
    print('💡 App will work without database')
"

echo "✅ Build completed successfully!"