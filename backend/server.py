#!/usr/bin/env python3
"""
Estate Manager Backend Server
A Flask-based REST API for managing real estate properties
"""

import os
import sys
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the db instance and the dictionary of models using a relative import
from models import db, models

# --- App Initialization & Config ---
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, 
           static_folder=project_root,
           static_url_path='',
           template_folder=project_root)

# Load configuration from environment variables
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_oJCB7e5ajzYO@ep-cold-mode-advs9k91-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
CORS(app)

# --- API Routes ---
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api': 'running',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': len([rule for rule in app.url_map.iter_rules() if rule.endpoint.startswith('api_')])
    }), 200

# --- Static File Serving ---
@app.route('/')
def serve_index():
    """Serve the main index.html file"""
    response = send_from_directory(app.static_folder, 'index.html')
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    return response

@app.route('/<path:filename>')
def serve_static_files(filename):
    """Serve static files (CSS, JS, images, etc.)"""
    try:
        response = send_from_directory(app.static_folder, filename)
        
        # Set proper content type based on file extension
        if filename.endswith('.css'):
            response.headers['Content-Type'] = 'text/css'
        elif filename.endswith('.js'):
            response.headers['Content-Type'] = 'application/javascript'
        elif filename.endswith('.json'):
            response.headers['Content-Type'] = 'application/json'
        elif filename.endswith('.html'):
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
        
        return response
    except FileNotFoundError:
        # If file not found, serve index.html (for SPA routing)
        response = send_from_directory(app.static_folder, 'index.html')
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response

# --- CLI Commands ---
@app.cli.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
    print("Database initialized successfully.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)