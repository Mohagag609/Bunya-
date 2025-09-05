#!/bin/bash

# This script is used by Render to start the web service.

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations/initializations
echo "Running database initialization..."
flask --app backend/server:app init-db

# Start the Gunicorn production server
echo "Starting Gunicorn server..."
gunicorn backend.server:app --bind 0.0.0.0:$PORT
