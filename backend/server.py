from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import click
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
from datetime import datetime
import traceback

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
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
app.config['SESSION_COOKIE_HTTPONLY'] = os.environ.get('SESSION_COOKIE_HTTPONLY', 'True').lower() == 'true'
app.config['SESSION_COOKIE_SAMESITE'] = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')

# Database engine options for better performance
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'pool_timeout': 20,
    'max_overflow': 0,
    'connect_args': {
        'options': '-c timezone=utc'
    }
}

db.init_app(app)

# --- Logging Configuration ---
def setup_logging():
    """Setup logging configuration"""
    if not app.debug:
        # Create logs directory if it doesn't exist
        log_dir = os.path.join(project_root, 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        # File handler for rotating logs
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, 'app.log'),
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Estate Manager startup')

# Setup logging
setup_logging()

# --- Security Middleware ---
@app.before_request
def before_request():
    """Security headers and request logging"""
    from flask import g
    
    # Add security headers
    g.start_time = datetime.utcnow()
    
    # Log request
    app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")

@app.after_request
def after_request(response):
    """Add security headers to response"""
    from flask import g
    
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Log response
    if hasattr(g, 'start_time'):
        duration = (datetime.utcnow() - g.start_time).total_seconds()
        app.logger.info(f"Response: {response.status_code} in {duration:.3f}s")
    
    return response

# Configure CORS to allow requests from localhost and the deployed frontend URL,
# with explicit methods and credentials support for better compatibility.
# Configure CORS for both local development and production
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:8000", 
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:8000", 
    "https://estate-pro-a62r.onrender.com"
]

# Add the current domain to allowed origins for production
if 'RENDER' in os.environ:
    # Get the service URL from Render environment
    service_url = os.environ.get('RENDER_EXTERNAL_URL', '')
    if service_url:
        allowed_origins.append(service_url)
        app.logger.info(f"Added Render service URL to CORS: {service_url}")
    
    # Also add any custom domains from environment
    custom_domains = os.environ.get('CUSTOM_DOMAINS', '')
    if custom_domains:
        for domain in custom_domains.split(','):
            domain = domain.strip()
            if domain:
                allowed_origins.append(f"https://{domain}")
                app.logger.info(f"Added custom domain to CORS: {domain}")

CORS(app, origins=allowed_origins, methods=["GET", "PUT", "POST", "DELETE"], supports_credentials=True)

# --- Dynamic CRUD API Creation ---

def create_and_register_views(app, model_name, model_class):
    """
    A factory that creates a class with CRUD methods and registers its routes with the Flask app.
    This prevents view function name collisions by encapsulating views in a class.
    """
    view_class_name = f"{model_name.capitalize()}API"

    # Get the name of the primary key column for this model
    pk_name = db.inspect(model_class).primary_key[0].name

    class CRUDView:
        def get_all(self):
            try:
                items = model_class.query.all()
                app.logger.info(f"Retrieved {len(items)} items from {model_name}")
                return jsonify([item.to_dict() for item in items])
            except Exception as e:
                app.logger.error(f"Error retrieving all items from {model_name}: {str(e)}")
                return jsonify({"error": "Internal server error"}), 500

        def get_one(self, item_id):
            try:
                item = model_class.query.get(item_id)
                if item is None:
                    app.logger.warning(f"Item {item_id} not found in {model_name}")
                    return jsonify({"error": "Item not found"}), 404
                app.logger.info(f"Retrieved item {item_id} from {model_name}")
                return jsonify(item.to_dict())
            except Exception as e:
                app.logger.error(f"Error retrieving item {item_id} from {model_name}: {str(e)}")
                return jsonify({"error": "Internal server error"}), 500

        def upsert(self, item_id):
            """
            Handles both creating a new item and updating an existing one (upsert).
            This is aligned with the original IndexedDB 'put' behavior.
            """
            try:
                item = model_class.query.get(item_id)
                data = request.get_json()
                if not data:
                    app.logger.warning(f"Invalid data received for {model_name}")
                    return jsonify({"error": "Invalid data"}), 400

                # The full object data, excluding the PK, goes into the 'data' field.
                item_data = {k: v for k, v in data.items() if k != pk_name}

                if item is None:  # Item does not exist, so create it
                    pk_value = data.get(pk_name)
                    # Ensure the ID in the URL matches the one in the payload
                    if str(item_id) != str(pk_value):
                        app.logger.warning(f"ID mismatch for {model_name}: URL={item_id}, Body={pk_value}")
                        return jsonify({"error": "ID in URL and body do not match"}), 400

                    new_item = model_class(**{pk_name: pk_value, 'data': item_data})
                    db.session.add(new_item)
                    db.session.commit()
                    app.logger.info(f"Created new item {item_id} in {model_name}")
                    return jsonify(new_item.to_dict()), 201  # Return 201 Created
                else:  # Item exists, so update it
                    item.data = item_data
                    db.session.commit()
                    app.logger.info(f"Updated item {item_id} in {model_name}")
                    return jsonify(item.to_dict()), 200  # Return 200 OK
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Error upserting item {item_id} in {model_name}: {str(e)}")
                app.logger.error(f"Traceback: {traceback.format_exc()}")
                return jsonify({"error": "Internal server error"}), 500

        def delete(self, item_id):
            try:
                item = model_class.query.get(item_id)
                if item is None:
                    app.logger.warning(f"Item {item_id} not found for deletion in {model_name}")
                    return jsonify({"error": "Item not found"}), 404

                db.session.delete(item)
                db.session.commit()
                app.logger.info(f"Deleted item {item_id} from {model_name}")
                return jsonify({"message": "Item deleted successfully"}), 200
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Error deleting item {item_id} from {model_name}: {str(e)}")
                return jsonify({"error": "Internal server error"}), 500

    view_instance = CRUDView()

    # Generate unique endpoint names for Flask's internal registry
    endpoint_prefix = f"{model_name}_api"

    # Register the URL rules using the methods from the class instance
    app.add_url_rule(f'/api/{model_name}', view_func=view_instance.get_all, methods=['GET'], endpoint=f'{endpoint_prefix}_get_all')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.get_one, methods=['GET'], endpoint=f'{endpoint_prefix}_get_one')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.upsert, methods=['PUT'], endpoint=f'{endpoint_prefix}_upsert')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.delete, methods=['DELETE'], endpoint=f'{endpoint_prefix}_delete')

# --- Register all model routes ---
# This must be done within an app context to access db.inspect
with app.app_context():
    for name, model_cls in models.items():
        create_and_register_views(app, name, model_cls)
        print(f"Registered CRUD endpoints for: /api/{name}")

# --- Health Check & Monitoring ---
@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'version': '1.0.0'
        }), 200
    except Exception as e:
        app.logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'disconnected',
            'error': str(e)
        }), 503

@app.route('/api/status')
def api_status():
    """API status endpoint"""
    return jsonify({
        'api': 'running',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': len([rule for rule in app.url_map.iter_rules() if rule.endpoint.startswith('api_')])
    }), 200

# --- Static File Serving & CLI ---
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

# All static files are handled by the generic serve_static_files function above
# This includes CSS, JS, JSON, HTML files with proper Content-Type headers

# Add a simple test route to verify the server is working
@app.route('/test')
def test_route():
    """Test route to verify server is working"""
    return jsonify({
        'status': 'success',
        'message': 'Server is working!',
        'timestamp': datetime.utcnow().isoformat()
    })

# Add route to serve the main application
@app.route('/app')
def serve_app():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/home')
def serve_home():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/dashboard')
def serve_dashboard():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/admin')
def serve_admin():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/manager')
def serve_manager():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate')
def serve_estate():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/real-estate')
def serve_real_estate():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/property')
def serve_property():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/investment')
def serve_investment():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/arabic')
def serve_arabic():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager')
def serve_estate_manager():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic')
def serve_estate_manager_arabic():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v2')
def serve_estate_manager_arabic_v2():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v3')
def serve_estate_manager_arabic_v3():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v4')
def serve_estate_manager_arabic_v4():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v5')
def serve_estate_manager_arabic_v5():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v6')
def serve_estate_manager_arabic_v6():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v7')
def serve_estate_manager_arabic_v7():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v8')
def serve_estate_manager_arabic_v8():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v9')
def serve_estate_manager_arabic_v9():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v10')
def serve_estate_manager_arabic_v10():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v11')
def serve_estate_manager_arabic_v11():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v12')
def serve_estate_manager_arabic_v12():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v13')
def serve_estate_manager_arabic_v13():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v14')
def serve_estate_manager_arabic_v14():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v15')
def serve_estate_manager_arabic_v15():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v16')
def serve_estate_manager_arabic_v16():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v17')
def serve_estate_manager_arabic_v17():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v18')
def serve_estate_manager_arabic_v18():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v19')
def serve_estate_manager_arabic_v19():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v20')
def serve_estate_manager_arabic_v20():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v21')
def serve_estate_manager_arabic_v21():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v22')
def serve_estate_manager_arabic_v22():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v23')
def serve_estate_manager_arabic_v23():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v24')
def serve_estate_manager_arabic_v24():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v25')
def serve_estate_manager_arabic_v25():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v26')
def serve_estate_manager_arabic_v26():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v27')
def serve_estate_manager_arabic_v27():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v28')
def serve_estate_manager_arabic_v28():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v29')
def serve_estate_manager_arabic_v29():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v30')
def serve_estate_manager_arabic_v30():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v31')
def serve_estate_manager_arabic_v31():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v32')
def serve_estate_manager_arabic_v32():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v33')
def serve_estate_manager_arabic_v33():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v34')
def serve_estate_manager_arabic_v34():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v35')
def serve_estate_manager_arabic_v35():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v36')
def serve_estate_manager_arabic_v36():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v37')
def serve_estate_manager_arabic_v37():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v38')
def serve_estate_manager_arabic_v38():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v39')
def serve_estate_manager_arabic_v39():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v40')
def serve_estate_manager_arabic_v40():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v41')
def serve_estate_manager_arabic_v41():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v42')
def serve_estate_manager_arabic_v42():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v43')
def serve_estate_manager_arabic_v43():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v44')
def serve_estate_manager_arabic_v44():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v45')
def serve_estate_manager_arabic_v45():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v46')
def serve_estate_manager_arabic_v46():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v47')
def serve_estate_manager_arabic_v47():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v48')
def serve_estate_manager_arabic_v48():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v49')
def serve_estate_manager_arabic_v49():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v50')
def serve_estate_manager_arabic_v50():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v51')
def serve_estate_manager_arabic_v51():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v52')
def serve_estate_manager_arabic_v52():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v53')
def serve_estate_manager_arabic_v53():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v54')
def serve_estate_manager_arabic_v54():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v55')
def serve_estate_manager_arabic_v55():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v56')
def serve_estate_manager_arabic_v56():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v57')
def serve_estate_manager_arabic_v57():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v58')
def serve_estate_manager_arabic_v58():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v59')
def serve_estate_manager_arabic_v59():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v60')
def serve_estate_manager_arabic_v60():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v61')
def serve_estate_manager_arabic_v61():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v62')
def serve_estate_manager_arabic_v62():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v63')
def serve_estate_manager_arabic_v63():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v64')
def serve_estate_manager_arabic_v64():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v65')
def serve_estate_manager_arabic_v65():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v66')
def serve_estate_manager_arabic_v66():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v67')
def serve_estate_manager_arabic_v67():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v68')
def serve_estate_manager_arabic_v68():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v69')
def serve_estate_manager_arabic_v69():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v70')
def serve_estate_manager_arabic_v70():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v71')
def serve_estate_manager_arabic_v71():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v72')
def serve_estate_manager_arabic_v72():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v73')
def serve_estate_manager_arabic_v73():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v74')
def serve_estate_manager_arabic_v74():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v75')
def serve_estate_manager_arabic_v75():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v76')
def serve_estate_manager_arabic_v76():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v77')
def serve_estate_manager_arabic_v77():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v78')
def serve_estate_manager_arabic_v78():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v79')
def serve_estate_manager_arabic_v79():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v80')
def serve_estate_manager_arabic_v80():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v81')
def serve_estate_manager_arabic_v81():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v82')
def serve_estate_manager_arabic_v82():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v83')
def serve_estate_manager_arabic_v83():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v84')
def serve_estate_manager_arabic_v84():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v85')
def serve_estate_manager_arabic_v85():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v86')
def serve_estate_manager_arabic_v86():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v87')
def serve_estate_manager_arabic_v87():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v88')
def serve_estate_manager_arabic_v88():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v89')
def serve_estate_manager_arabic_v89():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v90')
def serve_estate_manager_arabic_v90():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v91')
def serve_estate_manager_arabic_v91():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v92')
def serve_estate_manager_arabic_v92():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v93')
def serve_estate_manager_arabic_v93():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v94')
def serve_estate_manager_arabic_v94():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v95')
def serve_estate_manager_arabic_v95():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v96')
def serve_estate_manager_arabic_v96():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v97')
def serve_estate_manager_arabic_v97():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v98')
def serve_estate_manager_arabic_v98():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v99')
def serve_estate_manager_arabic_v99():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v100')
def serve_estate_manager_arabic_v100():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v101')
def serve_estate_manager_arabic_v101():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v102')
def serve_estate_manager_arabic_v102():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v103')
def serve_estate_manager_arabic_v103():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v104')
def serve_estate_manager_arabic_v104():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v105')
def serve_estate_manager_arabic_v105():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v106')
def serve_estate_manager_arabic_v106():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v107')
def serve_estate_manager_arabic_v107():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v108')
def serve_estate_manager_arabic_v108():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v109')
def serve_estate_manager_arabic_v109():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v110')
def serve_estate_manager_arabic_v110():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v111')
def serve_estate_manager_arabic_v111():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v112')
def serve_estate_manager_arabic_v112():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v113')
def serve_estate_manager_arabic_v113():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v114')
def serve_estate_manager_arabic_v114():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v115')
def serve_estate_manager_arabic_v115():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v116')
def serve_estate_manager_arabic_v116():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v117')
def serve_estate_manager_arabic_v117():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v118')
def serve_estate_manager_arabic_v118():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v119')
def serve_estate_manager_arabic_v119():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v120')
def serve_estate_manager_arabic_v120():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v121')
def serve_estate_manager_arabic_v121():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v122')
def serve_estate_manager_arabic_v122():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v123')
def serve_estate_manager_arabic_v123():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v124')
def serve_estate_manager_arabic_v124():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v125')
def serve_estate_manager_arabic_v125():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v126')
def serve_estate_manager_arabic_v126():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v127')
def serve_estate_manager_arabic_v127():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v128')
def serve_estate_manager_arabic_v128():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v129')
def serve_estate_manager_arabic_v129():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v130')
def serve_estate_manager_arabic_v130():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v131')
def serve_estate_manager_arabic_v131():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v132')
def serve_estate_manager_arabic_v132():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v133')
def serve_estate_manager_arabic_v133():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v134')
def serve_estate_manager_arabic_v134():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v135')
def serve_estate_manager_arabic_v135():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v136')
def serve_estate_manager_arabic_v136():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v137')
def serve_estate_manager_arabic_v137():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v138')
def serve_estate_manager_arabic_v138():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v139')
def serve_estate_manager_arabic_v139():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v140')
def serve_estate_manager_arabic_v140():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v141')
def serve_estate_manager_arabic_v141():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v142')
def serve_estate_manager_arabic_v142():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v143')
def serve_estate_manager_arabic_v143():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v144')
def serve_estate_manager_arabic_v144():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

# Add route to serve the main application
@app.route('/estate-manager-arabic-v145')
def serve_estate_manager_arabic_v145():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

@app.cli.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
    click.echo("Initialized the database.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
