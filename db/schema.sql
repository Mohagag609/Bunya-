-- Enable foreign key support
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Schema versioning
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
);

-- For miscellaneous key-value data, like migration status
CREATE TABLE IF NOT EXISTS keyval (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Application settings (a special case of key-value)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    theme TEXT,
    font INTEGER,
    pass TEXT
);

-- Core data tables
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    nationalId TEXT,
    address TEXT,
    status TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT,
    status TEXT,
    area TEXT,
    floor TEXT,
    building TEXT,
    notes TEXT,
    totalPrice REAL,
    unitType TEXT
);

CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    phone TEXT
);

CREATE TABLE IF NOT EXISTS brokers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS safes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    balance REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partnerGroups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS partnerGroupMembers (
    id TEXT PRIMARY KEY,
    groupId TEXT NOT NULL,
    partnerId TEXT NOT NULL,
    percent REAL NOT NULL,
    FOREIGN KEY (groupId) REFERENCES partnerGroups(id) ON DELETE CASCADE,
    FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    unitId TEXT NOT NULL,
    customerId TEXT NOT NULL,
    totalPrice REAL,
    downPayment REAL,
    discountAmount REAL,
    maintenanceDeposit REAL,
    brokerId TEXT,
    brokerPercent REAL,
    brokerAmount REAL,
    commissionSafeId TEXT,
    type TEXT,
    count INTEGER,
    extraAnnual INTEGER,
    annualPaymentValue REAL,
    start TEXT,
    FOREIGN KEY (unitId) REFERENCES units(id),
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (brokerId) REFERENCES brokers(id) ON DELETE SET NULL,
    FOREIGN KEY (commissionSafeId) REFERENCES safes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS unitPartners (
    id TEXT PRIMARY KEY,
    unitId TEXT NOT NULL,
    partnerId TEXT NOT NULL,
    percent REAL NOT NULL,
    FOREIGN KEY (unitId) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installments (
    id TEXT PRIMARY KEY,
    unitId TEXT NOT NULL,
    type TEXT,
    amount REAL,
    originalAmount REAL,
    dueDate TEXT,
    paymentDate TEXT,
    status TEXT,
    FOREIGN KEY (unitId) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'receipt' or 'payment'
    date TEXT,
    amount REAL,
    safeId TEXT,
    description TEXT,
    payer TEXT,
    beneficiary TEXT,
    linked_ref TEXT,
    FOREIGN KEY (safeId) REFERENCES safes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT
EXISTS brokerDues (
    id TEXT PRIMARY KEY,
    contractId TEXT NOT NULL,
    brokerId TEXT NOT NULL,
    amount REAL,
    dueDate TEXT,
    status TEXT,
    paymentDate TEXT,
    paidFromSafeId TEXT,
    FOREIGN KEY (contractId) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (brokerId) REFERENCES brokers(id) ON DELETE CASCADE,
    FOREIGN KEY (paidFromSafeId) REFERENCES safes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS partnerDebts (
    id TEXT PRIMARY KEY,
    unitId TEXT,
    payingPartnerId TEXT NOT NULL,
    owedPartnerId TEXT NOT NULL,
    amount REAL,
    dueDate TEXT,
    status TEXT,
    paymentDate TEXT,
    FOREIGN KEY (unitId) REFERENCES units(id) ON DELETE SET NULL,
    FOREIGN KEY (payingPartnerId) REFERENCES partners(id) ON DELETE CASCADE,
    FOREIGN KEY (owedPartnerId) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    fromSafeId TEXT NOT NULL,
    toSafeId TEXT NOT NULL,
    amount REAL,
    date TEXT,
    notes TEXT,
    FOREIGN KEY (fromSafeId) REFERENCES safes(id),
    FOREIGN KEY (toSafeId) REFERENCES safes(id)
);

CREATE TABLE IF NOT EXISTS auditLog (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    description TEXT,
    details TEXT
);
