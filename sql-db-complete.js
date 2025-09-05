// Complete SQL Database Operations for Real Estate Management System
// Uses SQL.js for client-side SQLite

let db = null;
let SQL = null;

// Initialize SQLite database
async function initSQLite() {
    return new Promise(async (resolve, reject) => {
        try {
            // Load SQL.js
            if (typeof window !== 'undefined' && window.SQL) {
                SQL = window.SQL;
            } else {
                // Fallback: try to load from CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js';
                script.onload = () => {
                    SQL = window.SQL;
                    initializeDB();
                };
                script.onerror = reject;
                document.head.appendChild(script);
                return;
            }
            
            initializeDB();
            
            function initializeDB() {
                try {
                    // Initialize SQL.js
                    const initSqlJs = SQL;
                    
                    initSqlJs({
                        // You can load the wasm file from a CDN
                        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
                    }).then(SQL => {
                        // Create a new database
                        db = new SQL.Database();
                        
                        // Load schema
                        loadSchema();
                        
                        // Load existing data from localStorage if available
                        loadExistingData();
                        
                        console.log('SQLite database initialized successfully');
                        resolve(db);
                    }).catch(reject);
                } catch (error) {
                    console.error('Failed to initialize SQL.js:', error);
                    reject(error);
                }
            }
        } catch (error) {
            console.error('Failed to initialize SQLite:', error);
            reject(error);
        }
    });
}

function loadSchema() {
    if (!db) return;
    
    const schema = `
    -- Real Estate Management System Database Schema
    PRAGMA foreign_keys = ON;

    -- Settings table (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
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
    CREATE TABLE IF NOT EXISTS partners (
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
    CREATE TABLE IF NOT EXISTS partner_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Partner Group Members table
    CREATE TABLE IF NOT EXISTS partner_group_members (
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
    CREATE TABLE IF NOT EXISTS brokers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Units table
    CREATE TABLE IF NOT EXISTS units (
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

    -- Unit Partners table
    CREATE TABLE IF NOT EXISTS unit_partners (
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
    CREATE TABLE IF NOT EXISTS contracts (
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Installments table
    CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY,
        unit_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        original_amount DECIMAL(15,2) NOT NULL,
        due_date DATE,
        payment_date DATE,
        status TEXT DEFAULT 'غير مدفوع',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Safes table
    CREATE TABLE IF NOT EXISTS safes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Vouchers table
    CREATE TABLE IF NOT EXISTS vouchers (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        safe_id TEXT NOT NULL,
        description TEXT,
        payer TEXT,
        beneficiary TEXT,
        linked_ref TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Broker Dues table
    CREATE TABLE IF NOT EXISTS broker_dues (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        broker_name TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'due',
        payment_date DATE,
        paid_from_safe_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Partner Debts table
    CREATE TABLE IF NOT EXISTS partner_debts (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'due',
        payment_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Transfers table
    CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        from_safe_id TEXT NOT NULL,
        to_safe_id TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Log table
    CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Key-Value store
    CREATE TABLE IF NOT EXISTS keyval (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
    CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);
    CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_installments_unit_id ON installments(unit_id);
    CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
    CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
    CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
    CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
    `;
    
    try {
        db.exec(schema);
        console.log('Database schema loaded successfully');
    } catch (error) {
        console.error('Failed to load schema:', error);
    }
}

function loadExistingData() {
    if (!db) return;
    
    try {
        // Check if we have existing data in localStorage
        const existingData = localStorage.getItem('estate_pro_state');
        if (existingData) {
            const data = JSON.parse(existingData);
            migrateFromLocalStorage(data);
        }
        
        // Insert default data if tables are empty
        insertDefaultData();
    } catch (error) {
        console.error('Failed to load existing data:', error);
    }
}

function insertDefaultData() {
    if (!db) return;
    
    try {
        // Check if we have any safes
        const safeCount = db.exec("SELECT COUNT(*) as count FROM safes")[0]?.values[0]?.[0] || 0;
        if (safeCount === 0) {
            db.exec(`
                INSERT INTO safes (id, name, balance) VALUES 
                ('S-default', 'الخزنة الرئيسية', 0)
            `);
        }
        
        // Check if we have settings
        const settingsCount = db.exec("SELECT COUNT(*) as count FROM settings")[0]?.values[0]?.[0] || 0;
        if (settingsCount === 0) {
            db.exec(`
                INSERT INTO settings (key, value) VALUES 
                ('theme', 'dark'),
                ('font', '16'),
                ('pass', NULL),
                ('migrationComplete', 'true')
            `);
        }
        
        console.log('Default data inserted successfully');
    } catch (error) {
        console.error('Failed to insert default data:', error);
    }
}

function migrateFromLocalStorage(data) {
    if (!db || !data) return;
    
    try {
        console.log('Migrating data from localStorage to SQL...');
        
        // Migrate each collection
        const collections = [
            'customers', 'units', 'partners', 'unitPartners', 'contracts',
            'installments', 'partnerDebts', 'safes', 'transfers', 'auditLog',
            'vouchers', 'brokerDues', 'brokers', 'partnerGroups'
        ];
        
        collections.forEach(collection => {
            const items = data[collection];
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    if (item && item.id) {
                        insertItem(collection, item);
                    }
                });
            }
        });
        
        // Migrate settings
        if (data.settings) {
            Object.entries(data.settings).forEach(([key, value]) => {
                insertItem('settings', { key, value });
            });
        }
        
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

function insertItem(table, item) {
    if (!db || !item) return;
    
    try {
        const columns = Object.keys(item);
        const values = Object.values(item);
        const placeholders = columns.map(() => '?').join(', ');
        
        const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const stmt = db.prepare(sql);
        stmt.run(values);
        stmt.free();
    } catch (error) {
        console.error(`Failed to insert item into ${table}:`, error);
    }
}

// Generic query execution function
function executeQuery(sql, params = []) {
    if (!db) {
        throw new Error('Database not initialized');
    }
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.get(params);
        stmt.free();
        return result;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    }
}

function executeQueryAll(sql, params = []) {
    if (!db) {
        throw new Error('Database not initialized');
    }
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.all(params);
        stmt.free();
        return result;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    }
}

// Generic insert function
function insert(tableName, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const stmt = db.prepare(sql);
    const result = stmt.run(values);
    stmt.free();
    return result;
}

// Generic update function
function update(tableName, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];
    
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    const stmt = db.prepare(sql);
    const result = stmt.run(values);
    stmt.free();
    return result;
}

// Generic delete function
function deleteRecord(tableName, whereClause, whereParams = []) {
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    const stmt = db.prepare(sql);
    const result = stmt.run(whereParams);
    stmt.free();
    return result;
}

// Generic select function
function select(tableName, whereClause = '', whereParams = [], orderBy = '') {
    let sql = `SELECT * FROM ${tableName}`;
    if (whereClause) {
        sql += ` WHERE ${whereClause}`;
    }
    if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
    }
    
    return executeQueryAll(sql, whereParams);
}

// Specific functions for each table
const customers = {
    getAll() {
        return select('customers', '', [], 'name ASC');
    },
    
    getById(id) {
        const results = select('customers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('customers', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('customers', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('customers', 'id = ?', [id]);
    }
};

const units = {
    getAll() {
        return select('units', '', [], 'code ASC');
    },
    
    getById(id) {
        const results = select('units', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('units', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('units', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('units', 'id = ?', [id]);
    }
};

const partners = {
    getAll() {
        return select('partners', '', [], 'name ASC');
    },
    
    getById(id) {
        const results = select('partners', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('partners', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('partners', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('partners', 'id = ?', [id]);
    }
};

const unitPartners = {
    getAll() {
        return select('unit_partners', '', [], 'unit_id ASC');
    },
    
    getByUnitId(unitId) {
        return select('unit_partners', 'unit_id = ?', [unitId]);
    },
    
    getByPartnerId(partnerId) {
        return select('unit_partners', 'partner_id = ?', [partnerId]);
    },
    
    create(data) {
        return insert('unit_partners', data);
    },
    
    update(id, data) {
        return update('unit_partners', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('unit_partners', 'id = ?', [id]);
    },
    
    deleteByUnitId(unitId) {
        return deleteRecord('unit_partners', 'unit_id = ?', [unitId]);
    }
};

const contracts = {
    getAll() {
        return select('contracts', '', [], 'created_at DESC');
    },
    
    getById(id) {
        const results = select('contracts', 'id = ?', [id]);
        return results[0] || null;
    },
    
    getByUnitId(unitId) {
        return select('contracts', 'unit_id = ?', [unitId]);
    },
    
    getByCustomerId(customerId) {
        return select('contracts', 'customer_id = ?', [customerId]);
    },
    
    create(data) {
        return insert('contracts', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('contracts', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('contracts', 'id = ?', [id]);
    }
};

const installments = {
    getAll() {
        return select('installments', '', [], 'due_date ASC');
    },
    
    getById(id) {
        const results = select('installments', 'id = ?', [id]);
        return results[0] || null;
    },
    
    getByUnitId(unitId) {
        return select('installments', 'unit_id = ?', [unitId], 'due_date ASC');
    },
    
    getByStatus(status) {
        return select('installments', 'status = ?', [status], 'due_date ASC');
    },
    
    create(data) {
        return insert('installments', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('installments', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('installments', 'id = ?', [id]);
    },
    
    deleteByUnitId(unitId) {
        return deleteRecord('installments', 'unit_id = ?', [unitId]);
    }
};

const safes = {
    getAll() {
        return select('safes', '', [], 'name ASC');
    },
    
    getById(id) {
        const results = select('safes', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('safes', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('safes', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('safes', 'id = ?', [id]);
    }
};

const vouchers = {
    getAll() {
        return select('vouchers', '', [], 'date DESC');
    },
    
    getById(id) {
        const results = select('vouchers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    getByType(type) {
        return select('vouchers', 'type = ?', [type], 'date DESC');
    },
    
    getBySafeId(safeId) {
        return select('vouchers', 'safe_id = ?', [safeId], 'date DESC');
    },
    
    create(data) {
        return insert('vouchers', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('vouchers', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('vouchers', 'id = ?', [id]);
    }
};

const brokerDues = {
    getAll() {
        return select('broker_dues', '', [], 'due_date ASC');
    },
    
    getById(id) {
        const results = select('broker_dues', 'id = ?', [id]);
        return results[0] || null;
    },
    
    getByContractId(contractId) {
        return select('broker_dues', 'contract_id = ?', [contractId]);
    },
    
    getByStatus(status) {
        return select('broker_dues', 'status = ?', [status], 'due_date ASC');
    },
    
    create(data) {
        return insert('broker_dues', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('broker_dues', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('broker_dues', 'id = ?', [id]);
    }
};

const partnerDebts = {
    getAll() {
        return select('partner_debts', '', [], 'due_date ASC');
    },
    
    getById(id) {
        const results = select('partner_debts', 'id = ?', [id]);
        return results[0] || null;
    },
    
    getByPartnerId(partnerId) {
        return select('partner_debts', 'partner_id = ?', [partnerId], 'due_date ASC');
    },
    
    getByStatus(status) {
        return select('partner_debts', 'status = ?', [status], 'due_date ASC');
    },
    
    create(data) {
        return insert('partner_debts', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('partner_debts', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('partner_debts', 'id = ?', [id]);
    }
};

const transfers = {
    getAll() {
        return select('transfers', '', [], 'date DESC');
    },
    
    getById(id) {
        const results = select('transfers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('transfers', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('transfers', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('transfers', 'id = ?', [id]);
    }
};

const auditLog = {
    getAll() {
        return select('audit_log', '', [], 'timestamp DESC');
    },
    
    getById(id) {
        const results = select('audit_log', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('audit_log', data);
    },
    
    delete(id) {
        return deleteRecord('audit_log', 'id = ?', [id]);
    }
};

const brokers = {
    getAll() {
        return select('brokers', '', [], 'name ASC');
    },
    
    getById(id) {
        const results = select('brokers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('brokers', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('brokers', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('brokers', 'id = ?', [id]);
    }
};

const partnerGroups = {
    getAll() {
        return select('partner_groups', '', [], 'name ASC');
    },
    
    getById(id) {
        const results = select('partner_groups', 'id = ?', [id]);
        return results[0] || null;
    },
    
    create(data) {
        return insert('partner_groups', data);
    },
    
    update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('partner_groups', data, 'id = ?', [id]);
    },
    
    delete(id) {
        return deleteRecord('partner_groups', 'id = ?', [id]);
    }
};

const partnerGroupMembers = {
    getByGroupId(groupId) {
        return select('partner_group_members', 'group_id = ?', [groupId]);
    },
    
    getByPartnerId(partnerId) {
        return select('partner_group_members', 'partner_id = ?', [partnerId]);
    },
    
    create(data) {
        return insert('partner_group_members', data);
    },
    
    delete(id) {
        return deleteRecord('partner_group_members', 'id = ?', [id]);
    },
    
    deleteByGroupId(groupId) {
        return deleteRecord('partner_group_members', 'group_id = ?', [groupId]);
    }
};

// Settings and key-value operations
const settings = {
    get(key) {
        const results = select('settings', 'key = ?', [key]);
        return results[0] ? results[0].value : undefined;
    },
    
    set(key, value) {
        return insert('settings', { key, value });
    },
    
    getAll() {
        const results = select('settings');
        const settingsObj = {};
        results.forEach(row => {
            settingsObj[row.key] = row.value;
        });
        return settingsObj;
    }
};

const keyval = {
    get(key) {
        const results = select('keyval', 'key = ?', [key]);
        return results[0] ? results[0].value : undefined;
    },
    
    set(key, value) {
        return insert('keyval', { key, value });
    }
};

// Export database for backup
function exportDatabase() {
    if (!db) return null;
    
    try {
        const data = db.export();
        return data;
    } catch (error) {
        console.error('Failed to export database:', error);
        return null;
    }
}

// Import database from backup
function importDatabase(data) {
    if (!db || !data) return false;
    
    try {
        db.close();
        db = new SQL.Database(data);
        return true;
    } catch (error) {
        console.error('Failed to import database:', error);
        return false;
    }
}

// Export all operations
window.SQLDB = {
    init: initSQLite,
    export: exportDatabase,
    import: importDatabase,
    customers,
    units,
    partners,
    unitPartners,
    contracts,
    installments,
    safes,
    vouchers,
    brokerDues,
    partnerDebts,
    transfers,
    auditLog,
    brokers,
    partnerGroups,
    partnerGroupMembers,
    settings,
    keyval
};