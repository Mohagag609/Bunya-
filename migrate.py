import json
import os
import sys
import click
from flask.cli import with_appcontext

# This is a bit of a hack to allow this script to import from its parent directory
# where server.py and models.py are located.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Now we can import the app and db objects
from server import app, db
from models import models

@click.command('import-json')
@click.argument('json_file', type=click.Path(exists=True))
@with_appcontext
def import_json_command(json_file):
    """
    Imports data from an IndexedDB JSON export into the PostgreSQL database.
    This script should be run after initializing the database with 'flask init-db'.

    Example usage from the project root directory:
    flask --app backend/server:app import-json database-export.json
    """
    click.echo(f"Starting data import from '{json_file}'...")

    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        click.secho(f"Error reading or parsing JSON file: {e}", fg='red')
        return

    total_records_added = 0
    with app.app_context():
        for store_name, records in data.items():
            if not records:
                continue

            if store_name not in models:
                click.secho(f"Warning: Model for '{store_name}' not found. Skipping.", fg='yellow')
                continue

            model_class = models[store_name]
            pk_name = db.inspect(model_class).primary_key[0].name

            count = 0
            for record in records:
                if not isinstance(record, dict) or pk_name not in record:
                    click.secho(f"Warning: Skipping invalid record in '{store_name}': {record}", fg='yellow')
                    continue

                pk_value = record.get(pk_name)

                # Check if the record already exists to avoid duplicates
                if model_class.query.get(pk_value):
                    continue # Skip if already exists

                item_data = {k: v for k, v in record.items() if k != pk_name}
                new_item_args = {
                    pk_name: pk_value,
                    'data': item_data
                }
                new_item = model_class(**new_item_args)
                db.session.add(new_item)
                count += 1

            total_records_added += count
            click.echo(f"-> Processing '{store_name}': Found {len(records)} records, adding {count} new records.")

        try:
            click.echo("Committing changes to the database...")
            db.session.commit()
            click.secho(f"Successfully imported a total of {total_records_added} new records.", fg='green')
        except Exception as e:
            click.secho(f"An error occurred during database commit: {e}", fg='red')
            click.secho("Rolling back changes.", fg='red')
            db.session.rollback()

# Add the command to the Flask CLI runner
app.cli.add_command(import_json_command)

# This part allows the script to be run directly for convenience,
# though using the Flask CLI is the recommended approach.
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python backend/migrate.py <path_to_json_file>")
        sys.exit(1)

    json_path = sys.argv[1]

    # We need to manually create an app context to run this standalone
    with app.app_context():
        import_json_command.callback(json_path)
