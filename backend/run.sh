#!/bin/bash

# This script is used by Render to start the web service.

# Exit immediately if a command exits with a non-zero status.
set -e

# Install dependencies
echo "Installing dependencies..."
pip install -r ../requirements.txt

# Run database migrations/initializations
echo "Running database initialization..."
export FLASK_APP=server.py
python -m flask init-db

# Start the Gunicorn production server
echo "Starting Gunicorn server..."
gunicorn backend.server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
