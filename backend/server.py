from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import click

# Import the db instance and the dictionary of models using a relative import
from models import db, models

# --- App Initialization & Config ---
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, static_folder=project_root)
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_7NGtZKAk8BCU@ep-polished-glitter-adyad3gu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
# Configure CORS to allow requests from localhost and the deployed frontend URL,
# with explicit methods and credentials support for better compatibility.
CORS(app, origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000", "http://127.0.0.1:8000", "https://estate-pro-a62r.onrender.com"], methods=["GET", "PUT", "POST", "DELETE"], supports_credentials=True)

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
            items = model_class.query.all()
            return jsonify([item.to_dict() for item in items])

        def get_one(self, item_id):
            item = model_class.query.get(item_id)
            if item is None:
                return jsonify({"error": "Item not found"}), 404
            return jsonify(item.to_dict())

        def upsert(self, item_id):
            """
            Handles both creating a new item and updating an existing one (upsert).
            This is aligned with the original IndexedDB 'put' behavior.
            """
            item = model_class.query.get(item_id)
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid data"}), 400

            # The full object data, excluding the PK, goes into the 'data' field.
            item_data = {k: v for k, v in data.items() if k != pk_name}

            if item is None:  # Item does not exist, so create it
                pk_value = data.get(pk_name)
                # Ensure the ID in the URL matches the one in the payload
                if str(item_id) != str(pk_value):
                    return jsonify({"error": "ID in URL and body do not match"}), 400

                new_item = model_class(**{pk_name: pk_value, 'data': item_data})
                db.session.add(new_item)
                db.session.commit()
                return jsonify(new_item.to_dict()), 201  # Return 201 Created
            else:  # Item exists, so update it
                item.data = item_data
                db.session.commit()
                return jsonify(item.to_dict()), 200  # Return 200 OK

        def delete(self, item_id):
            item = model_class.query.get(item_id)
            if item is None:
                return jsonify({"error": "Item not found"}), 404

            db.session.delete(item)
            db.session.commit()
            return jsonify({"message": "Item deleted successfully"}), 200

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
    app.run(debug=True, port=8000)
