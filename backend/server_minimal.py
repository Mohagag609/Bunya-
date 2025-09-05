#!/usr/bin/env python3
"""
Minimal server for debugging - Estate Manager
This is the simplest possible server to test basic functionality
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

# Create Flask app
app = Flask(__name__, static_folder='..')

# Enable CORS for all origins (for debugging)
CORS(app, origins="*", methods=["GET", "PUT", "POST", "DELETE"])

# Health check endpoint
@app.route('/health')
def health_check():
    """Simple health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'Estate Manager is running',
        'version': '1.0.0'
    }), 200

# API status endpoint
@app.route('/api/status')
def api_status():
    """API status"""
    return jsonify({
        'api': 'running',
        'message': 'API is working'
    }), 200

# Serve static files
@app.route('/')
def index():
    """Serve main page"""
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        return f"Error serving index.html: {str(e)}", 500

# Serve other static files
@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files"""
    try:
        return send_from_directory(app.static_folder, filename)
    except Exception as e:
        return f"File not found: {filename}", 404

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting minimal Estate Manager server...")
    print("📍 Health check: http://localhost:8000/health")
    print("📍 Main page: http://localhost:8000/")
    app.run(debug=True, host='0.0.0.0', port=8000)