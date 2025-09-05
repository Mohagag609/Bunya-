const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'estate_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
async function initialize() {
  try {
    await testConnection();
    await createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        national_id VARCHAR(20),
        address TEXT,
        status VARCHAR(50) DEFAULT 'نشط',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create units table
    await client.query(`
      CREATE TABLE IF NOT EXISTS units (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(255),
        floor VARCHAR(50),
        building VARCHAR(50),
        area DECIMAL(10,2),
        total_price DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'متاحة',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create partners table
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        national_id VARCHAR(20),
        address TEXT,
        status VARCHAR(50) DEFAULT 'نشط',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create unit_partners table (many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS unit_partners (
        id VARCHAR(50) PRIMARY KEY,
        unit_id VARCHAR(50) REFERENCES units(id) ON DELETE CASCADE,
        partner_id VARCHAR(50) REFERENCES partners(id) ON DELETE CASCADE,
        ownership_percentage DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_id, partner_id)
      )
    `);

    // Create contracts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id VARCHAR(50) PRIMARY KEY,
        unit_id VARCHAR(50) REFERENCES units(id) ON DELETE CASCADE,
        customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
        contract_date DATE,
        total_price DECIMAL(15,2),
        down_payment DECIMAL(15,2) DEFAULT 0,
        remaining_amount DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'نشط',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create installments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS installments (
        id VARCHAR(50) PRIMARY KEY,
        unit_id VARCHAR(50) REFERENCES units(id) ON DELETE CASCADE,
        contract_id VARCHAR(50) REFERENCES contracts(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'غير مدفوع',
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create partner_debts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_debts (
        id VARCHAR(50) PRIMARY KEY,
        partner_id VARCHAR(50) REFERENCES partners(id) ON DELETE CASCADE,
        unit_id VARCHAR(50) REFERENCES units(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        debt_type VARCHAR(50) DEFAULT 'مستحق',
        due_date DATE,
        status VARCHAR(50) DEFAULT 'غير مدفوع',
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create safes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS safes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transfers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id VARCHAR(50) PRIMARY KEY,
        from_safe_id VARCHAR(50) REFERENCES safes(id) ON DELETE CASCADE,
        to_safe_id VARCHAR(50) REFERENCES safes(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        transfer_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id VARCHAR(50) PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vouchers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(50) PRIMARY KEY,
        voucher_type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        safe_id VARCHAR(50) REFERENCES safes(id) ON DELETE CASCADE,
        linked_ref VARCHAR(50),
        voucher_date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create broker_dues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS broker_dues (
        id VARCHAR(50) PRIMARY KEY,
        broker_id VARCHAR(50),
        contract_id VARCHAR(50) REFERENCES contracts(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'غير مدفوع',
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create brokers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS brokers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        national_id VARCHAR(20),
        address TEXT,
        status VARCHAR(50) DEFAULT 'نشط',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create partner_groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_groups (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create keyval table for miscellaneous data
    await client.query(`
      CREATE TABLE IF NOT EXISTS keyval (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_national_id ON customers(national_id);
      CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);
      CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
      CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
      CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
      CREATE INDEX IF NOT EXISTS idx_installments_unit_id ON installments(unit_id);
      CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
    `);

    await client.query('COMMIT');
    console.log('All tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Generic CRUD operations
const db = {
  // Query execution
  async query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },

  // Get all records from a table
  async getAll(tableName, conditions = {}, orderBy = 'created_at DESC') {
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    let paramCount = 0;

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map(key => {
        paramCount++;
        return `${key} = $${paramCount}`;
      }).join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    const result = await this.query(query, params);
    return result.rows;
  },

  // Get single record by ID
  async getById(tableName, id) {
    const result = await this.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    return result.rows[0];
  },

  // Insert new record
  async insert(tableName, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  },

  // Update record by ID
  async update(tableName, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await this.query(query, [...values, id]);
    return result.rows[0];
  },

  // Delete record by ID
  async delete(tableName, id) {
    const result = await this.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  },

  // Initialize database
  initialize,
  testConnection
};

module.exports = db;