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
app = Flask(__name__, static_folder=project_root)

# Load configuration from environment variables
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_7NGtZKAk8BCU@ep-polished-glitter-adyad3gu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
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
    'max_overflow': 0
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
    # Add security headers
    from flask import g
    g.start_time = datetime.utcnow()
    
    # Log request
    app.logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")

@app.after_request
def after_request(response):
    """Add security headers to response"""
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
        db.session.execute('SELECT 1')
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
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    safe_path = os.path.abspath(os.path.join(app.static_folder, path))
    if not safe_path.startswith(app.static_folder):
        return "Not Found", 404
    if os.path.exists(safe_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.cli.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
    click.echo("Initialized the database.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
