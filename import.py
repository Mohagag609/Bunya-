import json
import sqlite3
import argparse
import sys
from collections import OrderedDict

def infer_sqlite_type(value):
    """Infers the SQLite data type from a Python value."""
    if isinstance(value, int):
        return 'INTEGER'
    elif isinstance(value, float):
        return 'REAL'
    elif isinstance(value, str):
        return 'TEXT'
    elif isinstance(value, bytes):
        return 'BLOB'
    else:
        # For lists, dicts, None, etc., store as JSON text
        return 'TEXT'

def get_all_columns(records):
    """
    Gets a superset of all column names from a list of records,
    preserving order as much as possible.
    """
    columns = OrderedDict()
    for record in records:
        if isinstance(record, dict):
            for key in record.keys():
                if key not in columns:
                    columns[key] = None
    return list(columns.keys())

def main():
    parser = argparse.ArgumentParser(
        description="Import data from a JSON export into a SQLite database.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("json_file", help="Path to the JSON export file (e.g., database-export.json).")
    parser.add_argument(
        "--db-file",
        default="estate_pro.sqlite",
        help="Path to the output SQLite database file (default: estate_pro.sqlite)."
    )
    args = parser.parse_args()

    try:
        with open(args.json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Successfully loaded JSON file: '{args.json_file}'")
    except FileNotFoundError:
        print(f"Error: The file '{args.json_file}' was not found.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from the file '{args.json_file}'. Make sure it is a valid JSON file.", file=sys.stderr)
        sys.exit(1)

    try:
        conn = sqlite3.connect(args.db_file)
        cursor = conn.cursor()
        print(f"Successfully connected to SQLite database: '{args.db_file}'")
    except sqlite3.Error as e:
        print(f"Error connecting to SQLite database: {e}", file=sys.stderr)
        sys.exit(1)

    for table_name, records in data.items():
        if not isinstance(records, list) or not records:
            print(f"Skipping '{table_name}': No records or invalid format.")
            continue

        print(f"\nProcessing table: '{table_name}' with {len(records)} records...")

        # 1. Infer schema from all records
        columns = get_all_columns(records)
        if not columns:
            print(f"Skipping table '{table_name}': No columns found.")
            continue

        # Determine primary key based on conventions from db.js
        pk = None
        if 'id' in columns:
            pk = 'id'
        elif 'key' in columns:
            pk = 'key'

        col_defs = []
        for col in columns:
            sample_value = None
            # Find the first non-None value for this column to infer type
            for record in records:
                if isinstance(record, dict) and col in record and record[col] is not None:
                    sample_value = record[col]
                    break

            col_type = infer_sqlite_type(sample_value)
            col_def = f'"{col}" {col_type}'
            if col == pk:
                col_def += ' PRIMARY KEY'
            col_defs.append(col_def)

        # 2. Create table
        create_table_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({", ".join(col_defs)})'
        try:
            cursor.execute(create_table_sql)
            print(f"Table '{table_name}' created or already exists.")
        except sqlite3.Error as e:
            print(f"Error creating table '{table_name}': {e}", file=sys.stderr)
            continue

        # 3. Insert data
        insert_count = 0
        for record in records:
            if not isinstance(record, dict):
                print(f"Skipping non-dictionary record in '{table_name}': {record}")
                continue

            # Use all columns for insertion to handle missing keys gracefully
            insert_cols = columns
            values = []
            for col in insert_cols:
                val = record.get(col) # Use .get() for safety
                if isinstance(val, (dict, list)):
                    values.append(json.dumps(val, ensure_ascii=False))
                else:
                    values.append(val)

            placeholders = ', '.join(['?'] * len(insert_cols))
            insert_sql = f'INSERT OR REPLACE INTO "{table_name}" ({", ".join(f\'"{c}"\' for c in insert_cols)}) VALUES ({placeholders})'

            try:
                cursor.execute(insert_sql, tuple(values))
                insert_count += 1
            except sqlite3.Error as e:
                print(f"Error inserting record into '{table_name}': {e}", file=sys.stderr)
                print(f"Problematic record: {record}", file=sys.stderr)

        print(f"Inserted or replaced {insert_count} records into '{table_name}'.")

    conn.commit()
    conn.close()

    print(f"\nImport complete. All data has been written to '{args.db_file}'.")

if __name__ == "__main__":
    main()
