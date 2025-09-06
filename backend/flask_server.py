#!/usr/bin/env python3
"""
Flask Server for Real Estate Manager with PostgreSQL
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import psycopg2, fallback to mock if not available
try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
    print("✅ psycopg2 imported successfully")
except ImportError as e:
    print(f"⚠️ psycopg2 not available: {e}")
    print("💡 App will work without database persistence")
    PSYCOPG2_AVAILABLE = False

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/real_estate_db')

def get_db_connection():
    """Get database connection"""
    if not PSYCOPG2_AVAILABLE:
        print("❌ psycopg2 not available, cannot connect to database")
        return None
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        print(f"DATABASE_URL: {DATABASE_URL[:50]}...")
        return None

def init_database():
    """Initialize database tables"""
    if not PSYCOPG2_AVAILABLE:
        print("❌ Cannot initialize database - psycopg2 not available")
        return False
        
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot initialize database - no connection")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create tables for each object store
        object_stores = [
            'customers', 'units', 'partners', 'unitPartners', 'contracts', 
            'installments', 'partnerDebts', 'safes', 'transfers', 'auditLog', 
            'vouchers', 'brokerDues', 'brokers', 'partnerGroups', 'settings'
        ]
        
        for store in object_stores:
            if store == 'settings':
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {store} (
                        key VARCHAR(255) PRIMARY KEY,
                        data JSONB NOT NULL
                    )
                """)
            else:
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {store} (
                        id VARCHAR(255) PRIMARY KEY,
                        data JSONB NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            print(f"✅ Created table: {store}")
        
        conn.commit()
        cursor.close()
        conn.close()
        print("🎉 Database initialization successful!")
        return True
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        return False

@app.route('/')
def serve_index():
    """Serve the main index.html"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "real-estate-manager",
        "database": "postgresql",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/<store_name>', methods=['GET'])
def get_all(store_name):
    """Get all items from a store"""
    # For now, return empty array if no database connection
    # This allows the app to work without PostgreSQL initially
    try:
        conn = get_db_connection()
        if not conn:
            print(f"No database connection, returning empty array for {store_name}")
            return jsonify([])
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        if store_name == 'settings':
            cursor.execute("SELECT data FROM settings WHERE key = %s", ('main',))
            result = cursor.fetchone()
            data = [result['data']] if result else []
        else:
            cursor.execute(f"SELECT data FROM {store_name} ORDER BY created_at")
            results = cursor.fetchall()
            data = [row['data'] for row in results]
        
        cursor.close()
        conn.close()
        return jsonify(data)
    
    except Exception as e:
        print(f"Error getting all from {store_name}: {e}")
        # Return empty array instead of error to allow app to work
        return jsonify([])

@app.route('/api/<store_name>/<item_id>', methods=['GET'])
def get_item(store_name, item_id):
    """Get a specific item by ID"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        if store_name == 'settings':
            cursor.execute("SELECT data FROM settings WHERE key = %s", (item_id,))
        else:
            cursor.execute(f"SELECT data FROM {store_name} WHERE id = %s", (item_id,))
        
        result = cursor.fetchone()
        data = result['data'] if result else None
        
        cursor.close()
        conn.close()
        return jsonify(data)
    
    except Exception as e:
        print(f"Error getting item {item_id} from {store_name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/<store_name>', methods=['POST', 'PUT'])
def save_item(store_name):
    """Save or update an item"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        data = request.get_json()
        cursor = conn.cursor()
        
        if store_name == 'settings':
            cursor.execute("""
                INSERT INTO settings (key, data) 
                VALUES (%s, %s) 
                ON CONFLICT (key) 
                DO UPDATE SET data = EXCLUDED.data
            """, (data.get('key', 'main'), json.dumps(data)))
        else:
            item_id = data.get('id')
            if not item_id:
                return jsonify({"error": "Item ID is required"}), 400
            
            cursor.execute(f"""
                INSERT INTO {store_name} (id, data, updated_at) 
                VALUES (%s, %s, CURRENT_TIMESTAMP) 
                ON CONFLICT (id) 
                DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
            """, (item_id, json.dumps(data)))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "data": data})
    
    except Exception as e:
        print(f"Error saving item to {store_name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/<store_name>/<item_id>', methods=['DELETE'])
def delete_item(store_name, item_id):
    """Delete an item by ID"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        if store_name == 'settings':
            cursor.execute("DELETE FROM settings WHERE key = %s", (item_id,))
        else:
            cursor.execute(f"DELETE FROM {store_name} WHERE id = %s", (item_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    
    except Exception as e:
        print(f"Error deleting item {item_id} from {store_name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/<store_name>', methods=['DELETE'])
def clear_store(store_name):
    """Clear all items from a store"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {store_name}")
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})
    
    except Exception as e:
        print(f"Error clearing {store_name}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize database
    print("🔧 Initializing database...")
    if PSYCOPG2_AVAILABLE:
        if init_database():
            print("✅ Database initialized successfully")
        else:
            print("⚠️ Database initialization failed - continuing without database")
            print("💡 The app will work but data won't persist")
    else:
        print("⚠️ psycopg2 not available - running without database")
        print("💡 The app will work but data won't persist")
    
    # Get port from environment
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🚀 Real Estate Manager Server starting...")
    print(f"📊 Database: {'PostgreSQL' if PSYCOPG2_AVAILABLE else 'Not Available'}")
    print(f"🌐 Server running at: http://localhost:{port}")
    print(f"🔧 Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"🔗 DATABASE_URL: {DATABASE_URL[:50]}...")
    
    app.run(host='0.0.0.0', port=port, debug=False)