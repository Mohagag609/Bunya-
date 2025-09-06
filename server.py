#!/usr/bin/env python3
"""
Real Estate Manager Server
Entry point for Render.com deployment with PostgreSQL
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the Flask server
from backend.flask_server import app

if __name__ == "__main__":
    app.run()