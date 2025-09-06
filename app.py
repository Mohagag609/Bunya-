#!/usr/bin/env python3
"""
Real Estate Manager App
Entry point for Render.com deployment
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the Flask app
from backend.flask_server import app

if __name__ == "__main__":
    app.run()