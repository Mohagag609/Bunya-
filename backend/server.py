from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
import os
import click
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='..')

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_mCShrFRbkc16@ep-small-salad-ad85fh4s-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Initialize database
db = SQLAlchemy(app)

# CORS configuration
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:8000", 
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:8000", 
    "https://estate-pro-a62r.onrender.com"
]

# Add current domain for production
if 'RENDER' in os.environ:
    service_url = os.environ.get('RENDER_EXTERNAL_URL', '')
    if service_url:
        allowed_origins.append(service_url)

CORS(app, origins=allowed_origins, methods=["GET", "PUT", "POST", "DELETE"], supports_credentials=True)

# Generic model for all data stores
class GenericModel(db.Model):
    __abstract__ = True
    
    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            if column.name == 'data':
                result.update(self.data or {})
            else:
                result[column.name] = getattr(self, column.name)
        return result

# Create specific models
def create_model(table_name, pk_name='id', pk_type=db.String(36)):
    class_name = table_name.capitalize()
    
    attributes = {
        '__tablename__': table_name,
        pk_name: db.Column(pk_type, primary_key=True),
        'data': db.Column(JSONB, nullable=False),
        'created_at': db.Column(db.DateTime, default=datetime.utcnow),
        'updated_at': db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow),
        'to_dict': lambda self: {
            pk_name: getattr(self, pk_name),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            **(self.data or {})
        }
    }
    
    return type(class_name, (GenericModel,), attributes)

# Object stores with 'id' as primary key
OBJECT_STORES_WITH_ID = [
    'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
    'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
    'brokers', 'partnerGroups'
]

# Create models
models = {}
for store in OBJECT_STORES_WITH_ID:
    model = create_model(store)
    models[store] = model

# Special cases with 'key' as primary key
settings_model = create_model('settings', pk_name='key')
models['settings'] = settings_model

keyval_model = create_model('keyval', pk_name='key')
models['keyval'] = keyval_model

# API Error handling
class APIError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code

@app.errorhandler(APIError)
def handle_api_error(error):
    return jsonify({'error': error.message}), error.status_code

@app.errorhandler(404)
def handle_not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def handle_internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Generic CRUD operations
def create_crud_routes(app, model_name, model_class):
    """Create CRUD routes for a model"""
    pk_name = db.inspect(model_class).primary_key[0].name
    
    @app.route(f'/api/{model_name}', methods=['GET'], endpoint=f'{model_name}_get_all')
    def get_all():
        try:
            items = model_class.query.all()
            return jsonify([item.to_dict() for item in items])
        except Exception as e:
            logger.error(f"Error fetching {model_name}: {e}")
            raise APIError(f"Failed to fetch {model_name}", 500)
    
    @app.route(f'/api/{model_name}/<item_id>', methods=['GET'], endpoint=f'{model_name}_get_one')
    def get_one(item_id):
        try:
            item = model_class.query.get(item_id)
            if item is None:
                raise APIError(f"{model_name} not found", 404)
            return jsonify(item.to_dict())
        except APIError:
            raise
        except Exception as e:
            logger.error(f"Error fetching {model_name} {item_id}: {e}")
            raise APIError(f"Failed to fetch {model_name}", 500)
    
    @app.route(f'/api/{model_name}/<item_id>', methods=['PUT'], endpoint=f'{model_name}_upsert')
    def upsert(item_id):
        try:
            data = request.get_json()
            if not data:
                raise APIError("Invalid data", 400)
            
            # Extract data excluding primary key
            item_data = {k: v for k, v in data.items() if k != pk_name}
            
            # Check if item exists
            item = model_class.query.get(item_id)
            
            if item is None:
                # Create new item
                if str(item_id) != str(data.get(pk_name)):
                    raise APIError("ID in URL and body do not match", 400)
                
                new_item = model_class(**{pk_name: item_id, 'data': item_data})
                db.session.add(new_item)
                db.session.commit()
                
                logger.info(f"Created new {model_name}: {item_id}")
                return jsonify(new_item.to_dict()), 201
            else:
                # Update existing item
                item.data = item_data
                item.updated_at = datetime.utcnow()
                db.session.commit()
                
                logger.info(f"Updated {model_name}: {item_id}")
                return jsonify(item.to_dict()), 200
                
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error upserting {model_name} {item_id}: {e}")
            raise APIError(f"Failed to save {model_name}", 500)
    
    @app.route(f'/api/{model_name}/<item_id>', methods=['DELETE'], endpoint=f'{model_name}_delete')
    def delete(item_id):
        try:
            item = model_class.query.get(item_id)
            if item is None:
                raise APIError(f"{model_name} not found", 404)
            
            db.session.delete(item)
            db.session.commit()
            
            logger.info(f"Deleted {model_name}: {item_id}")
            return jsonify({"message": f"{model_name} deleted successfully"}), 200
            
        except APIError:
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting {model_name} {item_id}: {e}")
            raise APIError(f"Failed to delete {model_name}", 500)

# Register all model routes
with app.app_context():
    for name, model_cls in models.items():
        try:
            create_crud_routes(app, name, model_cls)
            logger.info(f"Registered CRUD endpoints for: /api/{name}")
        except Exception as e:
            logger.error(f"Failed to register routes for {name}: {e}")

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'disconnected',
            'error': str(e)
        }), 503

# Static file serving
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    try:
        safe_path = os.path.abspath(os.path.join(app.static_folder, path))
        if not safe_path.startswith(app.static_folder):
            return "Not Found", 404
        
        if os.path.exists(safe_path):
            return send_from_directory(app.static_folder, path)
        else:
            # Serve index.html for SPA routing
            return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        logger.error(f"Error serving static file {path}: {e}")
        return "Not Found", 404

# CLI commands
@app.cli.command("init-db")
def init_db_command():
    """Initialize the database"""
    try:
        with app.app_context():
            db.create_all()
        click.echo("Database initialized successfully.")
    except Exception as e:
        click.echo(f"Error initializing database: {e}")

@app.cli.command("migrate")
def migrate_command():
    """Run database migrations"""
    try:
        with app.app_context():
            db.create_all()
        click.echo("Migrations completed successfully.")
    except Exception as e:
        click.echo(f"Error running migrations: {e}")

# Application startup
if __name__ == '__main__':
    try:
        # Initialize database
        with app.app_context():
            db.create_all()
            logger.info("Database initialized")
        
        # Start server
        port = int(os.environ.get('PORT', 8000))
        debug = os.environ.get('FLASK_ENV') == 'development'
        
        logger.info(f"Starting server on port {port}")
        app.run(debug=debug, host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise