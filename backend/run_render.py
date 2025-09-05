#!/usr/bin/env python3
"""
Render-optimized startup script for Estate Manager
This script handles Render-specific initialization and optimization
"""

import os
import sys
import time
import logging
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

def setup_render_environment():
    """Setup environment variables for Render"""
    # Load .env if it exists (for local development)
    load_dotenv()
    
    # Set Render-specific environment variables
    if 'RENDER' in os.environ:
        os.environ.setdefault('FLASK_ENV', 'production')
        os.environ.setdefault('LOG_LEVEL', 'INFO')
        os.environ.setdefault('SESSION_COOKIE_SECURE', 'true')
        os.environ.setdefault('SESSION_COOKIE_HTTPONLY', 'true')
        os.environ.setdefault('SESSION_COOKIE_SAMESITE', 'Lax')
        
        # Generate SECRET_KEY if not set
        if not os.environ.get('SECRET_KEY'):
            import secrets
            os.environ['SECRET_KEY'] = secrets.token_urlsafe(32)
            print("Generated SECRET_KEY for Render deployment")

def optimize_database():
    """Run database optimization for Render"""
    try:
        from optimize_db import main as optimize_main
        print("Running database optimization...")
        optimize_main()
        print("Database optimization completed successfully!")
        return True
    except Exception as e:
        print(f"Database optimization failed: {e}")
        print("Continuing without optimization...")
        return False

def health_check():
    """Perform health check"""
    try:
        from server import app, db
        with app.app_context():
            # Test database connection
            db.session.execute('SELECT 1')
            print("✅ Database connection successful")
            
            # Test basic functionality
            from models import models
            for name, model in models.items():
                count = model.query.count()
                print(f"✅ Table {name}: {count} records")
            
            return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def main():
    """Main startup function for Render"""
    print("🚀 Starting Estate Manager on Render...")
    print("=" * 50)
    
    # Setup environment
    setup_render_environment()
    
    # Run database optimization
    if not optimize_database():
        print("⚠️  Continuing without database optimization")
    
    # Perform health check
    if not health_check():
        print("❌ Health check failed, but continuing...")
    
    print("=" * 50)
    print("✅ Estate Manager is ready for Render!")
    print("🌐 Starting Gunicorn server...")
    
    # Import and run the Flask app
    from server import app
    
    # For Render, we'll let Gunicorn handle the server
    # This script is mainly for initialization
    return app

if __name__ == '__main__':
    app = main()
    # In production, Gunicorn will handle the server
    # This is just for testing
    if os.environ.get('FLASK_ENV') != 'production':
        app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))