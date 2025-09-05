-- Real Estate Management System Database Schema
-- Converted from IndexedDB to SQL

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Settings table (key-value store)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Customers table
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    national_id TEXT,
    address TEXT,
    status TEXT DEFAULT 'نشط',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Partners table
CREATE TABLE partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    national_id TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Partner Groups table
CREATE TABLE partner_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Partner Group Members table (many-to-many relationship)
CREATE TABLE partner_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES partner_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    UNIQUE(group_id, partner_id)
);

-- Brokers table
CREATE TABLE brokers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Units table
CREATE TABLE units (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'متاحة',
    area DECIMAL(10,2),
    floor TEXT,
    building TEXT,
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    unit_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Unit Partners table (many-to-many relationship)
CREATE TABLE unit_partners (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    UNIQUE(unit_id, partner_id)
);

-- Contracts table
CREATE TABLE contracts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    unit_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    maintenance_deposit DECIMAL(15,2) DEFAULT 0,
    broker_name TEXT,
    broker_percent DECIMAL(5,2) DEFAULT 0,
    broker_amount DECIMAL(15,2) DEFAULT 0,
    commission_safe_id TEXT,
    type TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    extra_annual INTEGER DEFAULT 0,
    annual_payment_value DECIMAL(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Installments table
CREATE TABLE installments (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    original_amount DECIMAL(15,2) NOT NULL,
    due_date DATE,
    payment_date DATE,
    status TEXT DEFAULT 'غير مدفوع',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- Safes table
CREATE TABLE safes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table
CREATE TABLE vouchers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'receipt' or 'payment'
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    safe_id TEXT NOT NULL,
    description TEXT,
    payer TEXT,
    beneficiary TEXT,
    linked_ref TEXT, -- Reference to contract, installment, or broker due
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (safe_id) REFERENCES safes(id) ON DELETE CASCADE
);

-- Broker Dues table
CREATE TABLE broker_dues (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    broker_name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'due',
    payment_date DATE,
    paid_from_safe_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_from_safe_id) REFERENCES safes(id) ON DELETE SET NULL
);

-- Partner Debts table
CREATE TABLE partner_debts (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'due',
    payment_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- Transfers table
CREATE TABLE transfers (
    id TEXT PRIMARY KEY,
    from_safe_id TEXT NOT NULL,
    to_safe_id TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_safe_id) REFERENCES safes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_safe_id) REFERENCES safes(id) ON DELETE CASCADE
);

-- Audit Log table
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    description TEXT NOT NULL,
    details TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Key-Value store for miscellaneous data
CREATE TABLE keyval (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_partners_name ON partners(name);
CREATE INDEX idx_units_code ON units(code);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_contracts_unit_id ON contracts(unit_id);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_installments_unit_id ON installments(unit_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_status ON installments(status);
CREATE INDEX idx_vouchers_date ON vouchers(date);
CREATE INDEX idx_vouchers_type ON vouchers(type);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Insert default safe
INSERT INTO safes (id, name, balance) VALUES ('S-default', 'الخزنة الرئيسية', 0);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('theme', 'dark'),
('font', '16'),
('pass', NULL),
('migrationComplete', 'true');