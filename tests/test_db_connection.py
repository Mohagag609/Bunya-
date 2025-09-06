#!/usr/bin/env python3
"""
Test database connection script
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_connection():
    """Test database connection"""
    try:
        # Import required modules
        from server import app, db
        
        print("🔌 Testing database connection...")
        print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
        
        with app.app_context():
            # Test basic connection
            result = db.session.execute('SELECT 1 as test').fetchone()
            print('✅ Database connection successful!')
            print(f'Test result: {result[0]}')
            
            # Test if we can create tables
            print("\n📋 Testing table creation...")
            db.create_all()
            print('✅ Tables created successfully!')
            
            # Test models
            from models import models
            print(f"\n📊 Found {len(models)} models:")
            for name, model in models.items():
                try:
                    count = model.query.count()
                    print(f'  ✅ {name}: {count} records')
                except Exception as e:
                    print(f'  ⚠️  {name}: {e}')
            
            print("\n🎉 Database test completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_connection()
    sys.exit(0 if success else 1)