#!/usr/bin/env python3
"""
Database initialization script for Render
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.server import app, db

def init_database():
    """Initialize the database"""
    print("🗄️ Initializing database...")
    
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database initialized successfully!")
            return True
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)