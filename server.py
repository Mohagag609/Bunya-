#!/usr/bin/env python3
"""
Real Estate Manager Server
Entry point for Render.com deployment
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the main server
from backend.server import main

if __name__ == "__main__":
    main()