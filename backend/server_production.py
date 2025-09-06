from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import click
from datetime import datetime

# Import the db instance and the dictionary of models using a relative import
from models import db, models

# --- App Initialization & Config ---
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, static_folder=project_root)
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_oJCB7e5ajzYO@ep-cold-mode-advs9k91-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Configure CORS
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:8000", 
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:8000", 
    "https://estate-pro-a62r.onrender.com"
]

# Add the current domain to allowed origins for production
if 'RENDER' in os.environ:
    service_url = os.environ.get('RENDER_EXTERNAL_URL', '')
    if service_url:
        allowed_origins.append(service_url)

CORS(app, origins=allowed_origins, methods=["GET", "PUT", "POST", "DELETE"], supports_credentials=True)

# Initialize SocketIO with proper configuration for production
socketio = SocketIO(
    app, 
    cors_allowed_origins=allowed_origins, 
    logger=True, 
    engineio_logger=True,
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25
)

# --- Dynamic CRUD API Creation ---

def create_and_register_views(app, model_name, model_class):
    view_class_name = f"{model_name.capitalize()}API"
    
    class GenericAPI:
        def __init__(self, model_class):
            self.model_class = model_class

        def get_all(self):
            try:
                items = self.model_class.query.all()
                return jsonify([{'id': item.id, 'data': item.data} for item in items])
            except Exception as e:
                return jsonify({'error': str(e)}), 500

        def get_one(self, item_id):
            try:
                item = self.model_class.query.get(item_id)
                if item:
                    return jsonify({'id': item.id, 'data': item.data})
                else:
                    return jsonify({'error': 'Item not found'}), 404
            except Exception as e:
                return jsonify({'error': str(e)}), 500

        def upsert(self, item_id):
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'error': 'No data provided'}), 400

                # Try to get existing item
                item = self.model_class.query.get(item_id)
                if item:
                    # Update existing item
                    item.data = data
                else:
                    # Create new item
                    item = self.model_class(id=item_id, data=data)
                    db.session.add(item)
                
                db.session.commit()
                return jsonify({'id': item.id, 'data': item.data})
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

        def delete(self, item_id):
            try:
                item = self.model_class.query.get(item_id)
                if item:
                    db.session.delete(item)
                    db.session.commit()
                    return jsonify({'message': 'Item deleted successfully'})
                else:
                    return jsonify({'error': 'Item not found'}), 404
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': str(e)}), 500

    # Create and register the view
    view_instance = GenericAPI(model_class)
    endpoint_prefix = f"{model_name}_api"
    
    app.add_url_rule(f'/api/{model_name}', view_func=view_instance.get_all, methods=['GET'], endpoint=f'{endpoint_prefix}_get_all')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.get_one, methods=['GET'], endpoint=f'{endpoint_prefix}_get_one')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.upsert, methods=['PUT'], endpoint=f'{endpoint_prefix}_upsert')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.delete, methods=['DELETE'], endpoint=f'{endpoint_prefix}_delete')

# Create all models and register their endpoints
for name, model_cls in models.items():
    create_and_register_views(app, name, model_cls)
    print(f"Registered CRUD endpoints for: /api/{name}")

# --- Health Check ---
@app.route('/health')
def health_check():
    try:
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'websocket': 'available',
            'api_sync': 'available',
            'version': '1.0.0'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 503

# API Sync endpoint - Support both GET and POST
@app.route('/api/sync', methods=['GET', 'POST'])
def api_sync():
    try:
        if request.method == 'GET':
            return jsonify({
                'status': 'success',
                'message': 'API Sync endpoint is working',
                'methods': ['GET', 'POST'],
                'timestamp': str(datetime.now())
            }), 200
        
        # Handle POST request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Process sync data
        sync_type = data.get('type', 'unknown')
        sync_data = data.get('data', {})
        
        # Emit sync event to connected clients
        socketio.emit('sync_update', {
            'type': sync_type,
            'data': sync_data,
            'timestamp': str(datetime.now())
        })
        
        return jsonify({
            'status': 'success',
            'message': 'Sync data processed',
            'timestamp': str(datetime.now())
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': str(datetime.now())
        }), 500

# --- WebSocket Routes ---
@app.route('/ws')
def websocket_route():
    return "WebSocket endpoint available at /socket.io/"

# WebSocket handshake test endpoint
@app.route('/ws-test')
def websocket_test():
    return """
    <!DOCTYPE html>
    <html>
    <head><title>WebSocket Test</title></head>
    <body>
        <h1>WebSocket Test</h1>
        <div id="status">Connecting...</div>
        <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
        <script>
            const socket = io();
            socket.on('connect', () => {
                document.getElementById('status').innerHTML = 'Connected: ' + socket.id;
            });
            socket.on('disconnect', () => {
                document.getElementById('status').innerHTML = 'Disconnected';
            });
        </script>
    </body>
    </html>
    """

# --- WebSocket Handlers ---
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('status', {
        'msg': 'Connected to server',
        'client_id': request.sid,
        'timestamp': str(datetime.now())
    })

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room', 'default')
    join_room(room)
    emit('status', {
        'msg': f'Joined room: {room}',
        'room': room,
        'timestamp': str(datetime.now())
    })

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room', 'default')
    leave_room(room)
    emit('status', {
        'msg': f'Left room: {room}',
        'room': room,
        'timestamp': str(datetime.now())
    })

@socketio.on('sync_request')
def handle_sync_request(data):
    # Handle sync request from client
    emit('sync_response', {
        'status': 'success',
        'data': data,
        'timestamp': str(datetime.now())
    })

@socketio.on('ping')
def handle_ping():
    emit('pong', {'timestamp': str(datetime.now())})

# --- Static File Serving ---
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    safe_path = os.path.abspath(os.path.join(app.static_folder, path))
    if not safe_path.startswith(app.static_folder):
        return "Forbidden", 403
    
    if os.path.exists(safe_path) and os.path.isfile(safe_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.cli.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
    click.echo("Initialized the database.")

# Production entry point
if __name__ == '__main__':
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")
        
        # Create default safe if none exists
        try:
            # Get the Safe model from the models dictionary
            Safe = models.get('safes')
            if Safe and Safe.query.count() == 0:
                default_safe = Safe(
                    id='S-default',
                    data={
                        'name': 'الخزنة الرئيسية',
                        'balance': 0,
                        'description': 'الخزنة الافتراضية للنظام'
                    }
                )
                db.session.add(default_safe)
                db.session.commit()
                print("Created default safe: الخزنة الرئيسية")
        except Exception as e:
            print(f"Error creating default safe: {e}")
    
    # Production mode - use Gunicorn
    print("Running in production mode with Gunicorn")
    # This will be handled by the Procfile