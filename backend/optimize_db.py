#!/usr/bin/env python3
"""
Database optimization script for Estate Manager
This script adds indexes and constraints to improve performance
without changing the data structure or functionality.
"""

import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from server import app, db

def create_indexes():
    """Create database indexes for better performance"""
    indexes = [
        # Customers indexes
        "CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin ((data->>'name'));",
        "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers USING btree ((data->>'phone'));",
        "CREATE INDEX IF NOT EXISTS idx_customers_created ON customers USING btree ((data->>'created'));",
        
        # Units indexes
        "CREATE INDEX IF NOT EXISTS idx_units_code ON units USING btree ((data->>'code'));",
        "CREATE INDEX IF NOT EXISTS idx_units_name ON units USING gin ((data->>'name'));",
        "CREATE INDEX IF NOT EXISTS idx_units_building ON units USING btree ((data->>'building'));",
        "CREATE INDEX IF NOT EXISTS idx_units_floor ON units USING btree ((data->>'floor'));",
        "CREATE INDEX IF NOT EXISTS idx_units_price ON units USING btree (((data->>'price')::numeric));",
        
        # Partners indexes
        "CREATE INDEX IF NOT EXISTS idx_partners_name ON partners USING gin ((data->>'name'));",
        "CREATE INDEX IF NOT EXISTS idx_partners_phone ON partners USING btree ((data->>'phone'));",
        
        # Contracts indexes
        "CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts USING btree ((data->>'customerId'));",
        "CREATE INDEX IF NOT EXISTS idx_contracts_unit ON contracts USING btree ((data->>'unitId'));",
        "CREATE INDEX IF NOT EXISTS idx_contracts_date ON contracts USING btree ((data->>'date'));",
        "CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts USING btree ((data->>'type'));",
        "CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts USING btree ((data->>'status'));",
        
        # Installments indexes
        "CREATE INDEX IF NOT EXISTS idx_installments_contract ON installments USING btree ((data->>'contractId'));",
        "CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments USING btree ((data->>'dueDate'));",
        "CREATE INDEX IF NOT EXISTS idx_installments_status ON installments USING btree ((data->>'status'));",
        "CREATE INDEX IF NOT EXISTS idx_installments_amount ON installments USING btree (((data->>'amount')::numeric));",
        
        # Safes indexes
        "CREATE INDEX IF NOT EXISTS idx_safes_name ON safes USING btree ((data->>'name'));",
        
        # Transfers indexes
        "CREATE INDEX IF NOT EXISTS idx_transfers_from_safe ON transfers USING btree ((data->>'fromSafe'));",
        "CREATE INDEX IF NOT EXISTS idx_transfers_to_safe ON transfers USING btree ((data->>'toSafe'));",
        "CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers USING btree ((data->>'date'));",
        "CREATE INDEX IF NOT EXISTS idx_transfers_amount ON transfers USING btree (((data->>'amount')::numeric));",
        
        # Audit log indexes
        "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON \"auditLog\" USING btree ((data->>'timestamp'));",
        "CREATE INDEX IF NOT EXISTS idx_audit_description ON \"auditLog\" USING gin ((data->>'description'));",
        
        # Brokers indexes
        "CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers USING gin ((data->>'name'));",
        "CREATE INDEX IF NOT EXISTS idx_brokers_phone ON brokers USING btree ((data->>'phone'));",
        
        # Partner debts indexes
        "CREATE INDEX IF NOT EXISTS idx_partner_debts_partner ON \"partnerDebts\" USING btree ((data->>'partnerId'));",
        "CREATE INDEX IF NOT EXISTS idx_partner_debts_date ON \"partnerDebts\" USING btree ((data->>'date'));",
        "CREATE INDEX IF NOT EXISTS idx_partner_debts_amount ON \"partnerDebts\" USING btree (((data->>'amount')::numeric));",
        
        # Broker dues indexes
        "CREATE INDEX IF NOT EXISTS idx_broker_dues_broker ON \"brokerDues\" USING btree ((data->>'brokerId'));",
        "CREATE INDEX IF NOT EXISTS idx_broker_dues_date ON \"brokerDues\" USING btree ((data->>'date'));",
        "CREATE INDEX IF NOT EXISTS idx_broker_dues_amount ON \"brokerDues\" USING btree (((data->>'amount')::numeric));",
    ]
    
    print("Creating database indexes...")
    with app.app_context():
        for index_sql in indexes:
            try:
                db.session.execute(text(index_sql))
                print(f"✓ Created index: {index_sql.split('idx_')[1].split(' ')[0]}")
            except Exception as e:
                print(f"✗ Failed to create index: {e}")
        
        db.session.commit()
        print("Database indexes created successfully!")

def create_constraints():
    """Create database constraints for data integrity"""
    constraints = [
        # Basic data validation constraints
        "ALTER TABLE customers ADD CONSTRAINT IF NOT EXISTS check_customer_name CHECK (data->>'name' IS NOT NULL AND length(data->>'name') > 0);",
        "ALTER TABLE units ADD CONSTRAINT IF NOT EXISTS check_unit_code CHECK (data->>'code' IS NOT NULL AND length(data->>'code') > 0);",
        "ALTER TABLE contracts ADD CONSTRAINT IF NOT EXISTS check_contract_customer CHECK (data->>'customerId' IS NOT NULL);",
        "ALTER TABLE contracts ADD CONSTRAINT IF NOT EXISTS check_contract_unit CHECK (data->>'unitId' IS NOT NULL);",
    ]
    
    print("Creating database constraints...")
    with app.app_context():
        for constraint_sql in constraints:
            try:
                db.session.execute(text(constraint_sql))
                print(f"✓ Created constraint: {constraint_sql.split('check_')[1].split(' ')[0]}")
            except Exception as e:
                print(f"✗ Failed to create constraint: {e}")
        
        db.session.commit()
        print("Database constraints created successfully!")

def analyze_tables():
    """Analyze tables for query optimization"""
    print("Analyzing tables for optimization...")
    with app.app_context():
        tables = [
            'customers', 'units', 'partners', 'contracts', 'installments',
            'safes', 'transfers', 'auditLog', 'brokers', 'partnerDebts',
            'brokerDues', 'partnerGroups', 'unitPartners', 'vouchers'
        ]
        
        for table in tables:
            try:
                db.session.execute(text(f"ANALYZE {table};"))
                print(f"✓ Analyzed table: {table}")
            except Exception as e:
                print(f"✗ Failed to analyze table {table}: {e}")
        
        db.session.commit()
        print("Table analysis completed!")

def main():
    """Main optimization function"""
    print("Starting database optimization...")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    try:
        # Create indexes
        create_indexes()
        print()
        
        # Create constraints
        create_constraints()
        print()
        
        # Analyze tables
        analyze_tables()
        print()
        
        print("=" * 50)
        print("Database optimization completed successfully!")
        
    except Exception as e:
        print(f"Error during optimization: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()