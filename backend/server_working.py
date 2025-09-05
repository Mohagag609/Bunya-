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

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=allowed_origins, logger=True, engineio_logger=True)

# --- Dynamic CRUD API Creation ---

def create_and_register_views(app, model_name, model_class):
    view_class_name = f"{model_name.capitalize()}API"
    pk_name = db.inspect(model_class).primary_key[0].name

    class CRUDView:
        def get_all(self):
            items = model_class.query.all()
            return jsonify([item.to_dict() for item in items])

        def get_one(self, item_id):
            item = model_class.query.get(item_id)
            if item is None:
                return jsonify({"error": "Item not found"}), 404
            return jsonify(item.to_dict())

        def upsert(self, item_id):
            item = model_class.query.get(item_id)
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid data"}), 400

            item_data = {k: v for k, v in data.items() if k != pk_name}

            if item is None:
                pk_value = data.get(pk_name)
                if str(item_id) != str(pk_value):
                    return jsonify({"error": "ID in URL and body do not match"}), 400

                new_item = model_class(**{pk_name: pk_value, 'data': item_data})
                db.session.add(new_item)
                db.session.commit()
                return jsonify(new_item.to_dict()), 201
            else:
                item.data = item_data
                db.session.commit()
                return jsonify(item.to_dict()), 200

        def delete(self, item_id):
            item = model_class.query.get(item_id)
            if item is None:
                return jsonify({"error": "Item not found"}), 404

            db.session.delete(item)
            db.session.commit()
            return jsonify({"message": "Item deleted successfully"}), 200

    view_instance = CRUDView()
    endpoint_prefix = f"{model_name}_api"

    app.add_url_rule(f'/api/{model_name}', view_func=view_instance.get_all, methods=['GET'], endpoint=f'{endpoint_prefix}_get_all')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.get_one, methods=['GET'], endpoint=f'{endpoint_prefix}_get_one')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.upsert, methods=['PUT'], endpoint=f'{endpoint_prefix}_upsert')
    app.add_url_rule(f'/api/{model_name}/<item_id>', view_func=view_instance.delete, methods=['DELETE'], endpoint=f'{endpoint_prefix}_delete')

# --- Register all model routes ---
with app.app_context():
    # Create all tables first
    db.create_all()
    print("Database tables created successfully!")
    
    # Create main safe if it doesn't exist
    from models import models
    safes_model = models.get('safes')
    if safes_model:
        existing_safe = safes_model.query.filter_by(id='S-main').first()
        if not existing_safe:
            main_safe = safes_model(id='S-main', data={'name': 'الخزنة الرئيسية', 'balance': 0})
            db.session.add(main_safe)
            db.session.commit()
            print("Main safe created successfully!")
    
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
            'version': '1.0.0'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 503

# API Sync endpoint
@app.route('/api/sync', methods=['POST'])
def api_sync():
    try:
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

# --- WebSocket Handlers ---
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('status', {'msg': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room', 'default')
    join_room(room)
    emit('status', {'msg': f'Joined room: {room}'})

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room', 'default')
    leave_room(room)
    emit('status', {'msg': f'Left room: {room}'})

@socketio.on('sync_request')
def handle_sync_request(data):
    # Handle sync request from client
    emit('sync_response', {
        'status': 'success',
        'data': data,
        'timestamp': str(datetime.now())
    })

# --- Static File Serving ---
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
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default safe if none exists
        try:
            from models import Safe
            if Safe.query.count() == 0:
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
    
    # Run with SocketIO
    socketio.run(app, debug=True, host='0.0.0.0', port=8000)