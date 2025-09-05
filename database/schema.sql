-- Real Estate Management System Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    national_id VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'نشط',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partner Groups table
CREATE TABLE IF NOT EXISTS partner_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'متاحة',
    area VARCHAR(50),
    floor VARCHAR(20),
    building VARCHAR(50),
    notes TEXT,
    total_price DECIMAL(15,2) DEFAULT 0,
    unit_type VARCHAR(20) DEFAULT 'سكني',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unit Partners relationship table
CREATE TABLE IF NOT EXISTS unit_partners (
    id VARCHAR(50) PRIMARY KEY,
    unit_id VARCHAR(50) REFERENCES units(id) ON DELETE CASCADE,
    partner_id VARCHAR(50) REFERENCES partners(id) ON DELETE CASCADE,
    percent DECIMAL(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_id, partner_id)
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    unit_id VARCHAR(50) REFERENCES units(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    total_price DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    maintenance_deposit DECIMAL(15,2) DEFAULT 0,
    broker_name VARCHAR(100),
    broker_percent DECIMAL(5,2) DEFAULT 0,
    broker_amount DECIMAL(15,2) DEFAULT 0,
    commission_safe_id VARCHAR(50),
    type VARCHAR(20) DEFAULT 'cash',
    count INTEGER DEFAULT 1,
    extra_annual INTEGER DEFAULT 0 CHECK (extra_annual >= 0 AND extra_annual <= 3),
    annual_payment_value DECIMAL(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Installments table
CREATE TABLE IF NOT EXISTS installments (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) REFERENCES contracts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safes table
CREATE TABLE IF NOT EXISTS safes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'payment')),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    safe_id VARCHAR(50) REFERENCES safes(id) ON DELETE SET NULL,
    description TEXT,
    payer VARCHAR(100),
    beneficiary VARCHAR(100),
    linked_ref VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id VARCHAR(50) PRIMARY KEY,
    from_safe_id VARCHAR(50) REFERENCES safes(id) ON DELETE SET NULL,
    to_safe_id VARCHAR(50) REFERENCES safes(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partner Debts table
CREATE TABLE IF NOT EXISTS partner_debts (
    id VARCHAR(50) PRIMARY KEY,
    partner_id VARCHAR(50) REFERENCES partners(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brokers table
CREATE TABLE IF NOT EXISTS brokers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Broker Dues table
CREATE TABLE IF NOT EXISTS broker_dues (
    id VARCHAR(50) PRIMARY KEY,
    broker_id VARCHAR(50) REFERENCES brokers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_national_id ON customers(national_id);
CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_installments_contract_id ON installments(contract_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
DO $$
BEGIN
    -- Users trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Customers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN
        CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Partners trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_partners_updated_at') THEN
        CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Partner Groups trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_partner_groups_updated_at') THEN
        CREATE TRIGGER update_partner_groups_updated_at BEFORE UPDATE ON partner_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Units trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_units_updated_at') THEN
        CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Contracts trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contracts_updated_at') THEN
        CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Installments trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_installments_updated_at') THEN
        CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Safes trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_safes_updated_at') THEN
        CREATE TRIGGER update_safes_updated_at BEFORE UPDATE ON safes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Vouchers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vouchers_updated_at') THEN
        CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Transfers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transfers_updated_at') THEN
        CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Partner Debts trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_partner_debts_updated_at') THEN
        CREATE TRIGGER update_partner_debts_updated_at BEFORE UPDATE ON partner_debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Brokers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brokers_updated_at') THEN
        CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON brokers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Broker Dues trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_broker_dues_updated_at') THEN
        CREATE TRIGGER update_broker_dues_updated_at BEFORE UPDATE ON broker_dues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Settings trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_updated_at') THEN
        CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;