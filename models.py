from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base

# Initialize SQLAlchemy instance. This will be connected to the Flask app later.
db = SQLAlchemy()

# A dictionary to hold our dynamically created model classes
models = {}

def create_generic_model(table_name, pk_name='id', pk_type=db.String(36)):
    """
    A factory function to create a generic model class dynamically.
    Each model will have a primary key and a JSONB column to hold the object's data.
    This is a flexible approach for schemaless data from IndexedDB.
    """
    class_name = table_name.capitalize()

    # Define the attributes for the new class
    attributes = {
        '__tablename__': table_name,
        pk_name: db.Column(pk_type, primary_key=True),
        'data': db.Column(JSONB, nullable=False),

        # A helper method to serialize the object to a dictionary
        'to_dict': lambda self: {
            pk_name: getattr(self, pk_name),
            **self.data
        }
    }

    # The 'type' function creates a new class: type(ClassName, (BaseClasses,), {attributes})
    model_class = type(class_name, (db.Model,), attributes)

    return model_class

# List of tables from db.js that use 'id' as the primary key
# Assuming IDs are strings (like UUIDs), which is a common practice.
OBJECT_STORES_WITH_ID_PK = [
    'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
    'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
    'brokers', 'partnerGroups'
]

# Create all the models with 'id' as the primary key
for store in OBJECT_STORES_WITH_ID_PK:
    model = create_generic_model(store)
    models[store] = model
    # Add the class to the module's globals so it can be imported directly
    globals()[model.__name__] = model

# Handle the special cases with 'key' as primary key
settings_model = create_generic_model('settings', pk_name='key')
models['settings'] = settings_model
globals()[settings_model.__name__] = settings_model

keyval_model = create_generic_model('keyval', pk_name='key')
models['keyval'] = keyval_model
globals()[keyval_model.__name__] = keyval_model
