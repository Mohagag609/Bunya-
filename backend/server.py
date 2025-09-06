#!/usr/bin/env python3
"""
Simple HTTP Server for Real Estate Manager
Compatible with Render.com deployment
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse, parse_qs

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler with proper headers and routing"""
    
    def end_headers(self):
        """Add custom headers for better caching and security"""
        # Cache control for static assets
        if self.path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg')):
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        
        # CORS headers for API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        super().end_headers()

    def do_GET(self):
        """Handle GET requests with custom routing"""
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Health check endpoint
        if path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "healthy", "service": "real-estate-manager"}')
            return
        
        # Route to index.html for root and SPA routes
        if path == '/' or path == '':
            self.path = '/frontend/index.html'
        elif path.startswith('/api/'):
            # Handle API routes (if needed in the future)
            self.handle_api_request(parsed_path)
            return
        elif not os.path.exists('.' + path):
            # For SPA routing, serve index.html for unknown paths
            self.path = '/frontend/index.html'
        
        # Call parent method
        return super().do_GET()

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.end_headers()

    def handle_api_request(self, parsed_path):
        """Handle API requests (placeholder for future functionality)"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        # Simple API response
        response = {
            'status': 'success',
            'message': 'API endpoint reached',
            'path': parsed_path.path,
            'query': parsed_path.query
        }
        
        import json
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        """Custom log format"""
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

def main():
    """Main server function"""
    # Get port from environment variable (Render requirement)
    PORT = int(os.environ.get('PORT', 8000))
    
    # Change to the parent directory to serve frontend files
    web_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(web_dir)
    
    # Create server
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"🚀 Real Estate Manager Server starting...")
        print(f"📁 Serving from: {web_dir}")
        print(f"🌐 Server running at: http://localhost:{PORT}")
        print(f"🔧 Environment: {os.environ.get('NODE_ENV', 'development')}")
        print(f"📊 Python version: {sys.version}")
        print("=" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            httpd.shutdown()
        except Exception as e:
            print(f"❌ Server error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()