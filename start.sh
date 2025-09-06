#!/bin/bash

# Start script for Render deployment
# This script runs database optimization and starts the server

set -e

echo "🚀 Starting Estate Manager on Render..."

# Run database optimization
echo "⚡ Running database optimization..."
python backend/optimize_db.py

# Start the server
echo "🌐 Starting Gunicorn server..."
exec gunicorn backend.server:app --config gunicorn.conf.py