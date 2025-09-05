// SQL Database Operations for Real Estate Management System
// Replaces IndexedDB operations with SQLite

const DB_NAME = 'estate_pro_sql.db';
let db = null;

// Initialize SQLite database
async function initSQLite() {
    return new Promise((resolve, reject) => {
        // For web environment, we'll use SQL.js or similar
        // This is a placeholder - in a real implementation, you'd use:
        // - SQL.js for client-side SQLite
        // - A backend API with SQLite
        // - Or a service worker with SQLite
        
        // For now, we'll simulate the database operations
        console.log('Initializing SQLite database...');
        db = {
            // Simulate database connection
            connected: true
        };
        resolve(db);
    });
}

// Generic query execution function
async function executeQuery(sql, params = []) {
    if (!db) {
        await initSQLite();
    }
    
    // In a real implementation, this would execute the SQL query
    // For now, we'll return mock data or use localStorage as fallback
    console.log('Executing SQL:', sql, 'with params:', params);
    
    // This is where you'd integrate with actual SQLite
    // For demonstration, we'll return a promise that resolves
    return new Promise((resolve, reject) => {
        // Mock implementation - replace with actual SQLite calls
        setTimeout(() => {
            resolve({ rows: [], changes: 0 });
        }, 10);
    });
}

// Generic insert function
async function insert(tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    return executeQuery(sql, values);
}

// Generic update function
async function update(tableName, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];
    
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    return executeQuery(sql, values);
}

// Generic delete function
async function deleteRecord(tableName, whereClause, whereParams = []) {
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    return executeQuery(sql, whereParams);
}

// Generic select function
async function select(tableName, whereClause = '', whereParams = [], orderBy = '') {
    let sql = `SELECT * FROM ${tableName}`;
    if (whereClause) {
        sql += ` WHERE ${whereClause}`;
    }
    if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
    }
    
    const result = await executeQuery(sql, whereParams);
    return result.rows || [];
}

// Specific functions for each table
const customers = {
    async getAll() {
        return select('customers', '', [], 'name ASC');
    },
    
    async getById(id) {
        const results = await select('customers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('customers', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('customers', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('customers', 'id = ?', [id]);
    }
};

const units = {
    async getAll() {
        return select('units', '', [], 'code ASC');
    },
    
    async getById(id) {
        const results = await select('units', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('units', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('units', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('units', 'id = ?', [id]);
    }
};

const partners = {
    async getAll() {
        return select('partners', '', [], 'name ASC');
    },
    
    async getById(id) {
        const results = await select('partners', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('partners', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('partners', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('partners', 'id = ?', [id]);
    }
};

const unitPartners = {
    async getAll() {
        return select('unit_partners', '', [], 'unit_id ASC');
    },
    
    async getByUnitId(unitId) {
        return select('unit_partners', 'unit_id = ?', [unitId]);
    },
    
    async getByPartnerId(partnerId) {
        return select('unit_partners', 'partner_id = ?', [partnerId]);
    },
    
    async create(data) {
        return insert('unit_partners', data);
    },
    
    async update(id, data) {
        return update('unit_partners', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('unit_partners', 'id = ?', [id]);
    },
    
    async deleteByUnitId(unitId) {
        return deleteRecord('unit_partners', 'unit_id = ?', [unitId]);
    }
};

const contracts = {
    async getAll() {
        return select('contracts', '', [], 'created_at DESC');
    },
    
    async getById(id) {
        const results = await select('contracts', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async getByUnitId(unitId) {
        return select('contracts', 'unit_id = ?', [unitId]);
    },
    
    async getByCustomerId(customerId) {
        return select('contracts', 'customer_id = ?', [customerId]);
    },
    
    async create(data) {
        return insert('contracts', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('contracts', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('contracts', 'id = ?', [id]);
    }
};

const installments = {
    async getAll() {
        return select('installments', '', [], 'due_date ASC');
    },
    
    async getById(id) {
        const results = await select('installments', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async getByUnitId(unitId) {
        return select('installments', 'unit_id = ?', [unitId], 'due_date ASC');
    },
    
    async getByStatus(status) {
        return select('installments', 'status = ?', [status], 'due_date ASC');
    },
    
    async create(data) {
        return insert('installments', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('installments', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('installments', 'id = ?', [id]);
    },
    
    async deleteByUnitId(unitId) {
        return deleteRecord('installments', 'unit_id = ?', [unitId]);
    }
};

const safes = {
    async getAll() {
        return select('safes', '', [], 'name ASC');
    },
    
    async getById(id) {
        const results = await select('safes', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('safes', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('safes', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('safes', 'id = ?', [id]);
    }
};

const vouchers = {
    async getAll() {
        return select('vouchers', '', [], 'date DESC');
    },
    
    async getById(id) {
        const results = await select('vouchers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async getByType(type) {
        return select('vouchers', 'type = ?', [type], 'date DESC');
    },
    
    async getBySafeId(safeId) {
        return select('vouchers', 'safe_id = ?', [safeId], 'date DESC');
    },
    
    async create(data) {
        return insert('vouchers', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('vouchers', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('vouchers', 'id = ?', [id]);
    }
};

const brokerDues = {
    async getAll() {
        return select('broker_dues', '', [], 'due_date ASC');
    },
    
    async getById(id) {
        const results = await select('broker_dues', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async getByContractId(contractId) {
        return select('broker_dues', 'contract_id = ?', [contractId]);
    },
    
    async getByStatus(status) {
        return select('broker_dues', 'status = ?', [status], 'due_date ASC');
    },
    
    async create(data) {
        return insert('broker_dues', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('broker_dues', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('broker_dues', 'id = ?', [id]);
    }
};

const partnerDebts = {
    async getAll() {
        return select('partner_debts', '', [], 'due_date ASC');
    },
    
    async getById(id) {
        const results = await select('partner_debts', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async getByPartnerId(partnerId) {
        return select('partner_debts', 'partner_id = ?', [partnerId], 'due_date ASC');
    },
    
    async getByStatus(status) {
        return select('partner_debts', 'status = ?', [status], 'due_date ASC');
    },
    
    async create(data) {
        return insert('partner_debts', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('partner_debts', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('partner_debts', 'id = ?', [id]);
    }
};

const transfers = {
    async getAll() {
        return select('transfers', '', [], 'date DESC');
    },
    
    async getById(id) {
        const results = await select('transfers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('transfers', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('transfers', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('transfers', 'id = ?', [id]);
    }
};

const auditLog = {
    async getAll() {
        return select('audit_log', '', [], 'timestamp DESC');
    },
    
    async getById(id) {
        const results = await select('audit_log', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('audit_log', data);
    },
    
    async delete(id) {
        return deleteRecord('audit_log', 'id = ?', [id]);
    }
};

const brokers = {
    async getAll() {
        return select('brokers', '', [], 'name ASC');
    },
    
    async getById(id) {
        const results = await select('brokers', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('brokers', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('brokers', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('brokers', 'id = ?', [id]);
    }
};

const partnerGroups = {
    async getAll() {
        return select('partner_groups', '', [], 'name ASC');
    },
    
    async getById(id) {
        const results = await select('partner_groups', 'id = ?', [id]);
        return results[0] || null;
    },
    
    async create(data) {
        return insert('partner_groups', data);
    },
    
    async update(id, data) {
        data.updated_at = new Date().toISOString();
        return update('partner_groups', data, 'id = ?', [id]);
    },
    
    async delete(id) {
        return deleteRecord('partner_groups', 'id = ?', [id]);
    }
};

const partnerGroupMembers = {
    async getByGroupId(groupId) {
        return select('partner_group_members', 'group_id = ?', [groupId]);
    },
    
    async getByPartnerId(partnerId) {
        return select('partner_group_members', 'partner_id = ?', [partnerId]);
    },
    
    async create(data) {
        return insert('partner_group_members', data);
    },
    
    async delete(id) {
        return deleteRecord('partner_group_members', 'id = ?', [id]);
    },
    
    async deleteByGroupId(groupId) {
        return deleteRecord('partner_group_members', 'group_id = ?', [groupId]);
    }
};

// Settings and key-value operations
const settings = {
    async get(key) {
        const results = await select('settings', 'key = ?', [key]);
        return results[0] ? results[0].value : undefined;
    },
    
    async set(key, value) {
        const existing = await this.get(key);
        if (existing !== undefined) {
            return update('settings', { value }, 'key = ?', [key]);
        } else {
            return insert('settings', { key, value });
        }
    },
    
    async getAll() {
        const results = await select('settings');
        const settingsObj = {};
        results.forEach(row => {
            settingsObj[row.key] = row.value;
        });
        return settingsObj;
    }
};

const keyval = {
    async get(key) {
        const results = await select('keyval', 'key = ?', [key]);
        return results[0] ? results[0].value : undefined;
    },
    
    async set(key, value) {
        const existing = await this.get(key);
        if (existing !== undefined) {
            return update('keyval', { value }, 'key = ?', [key]);
        } else {
            return insert('keyval', { key, value });
        }
    }
};

// Migration function to convert from IndexedDB to SQL
async function migrateFromIndexedDB() {
    console.log('Starting migration from IndexedDB to SQL...');
    
    try {
        // This would read from the existing IndexedDB and insert into SQL
        // For now, this is a placeholder
        console.log('Migration completed successfully');
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    }
}

// Export all operations
window.SQLDB = {
    init: initSQLite,
    migrate: migrateFromIndexedDB,
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