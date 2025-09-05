const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'estate_management',
    user: process.env.DB_USER || 'estate_user',
    password: process.env.DB_PASSWORD || 'password',
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Starting database migration...');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    console.log('✓ Executed statement');
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log('⚠ Statement already executed (skipping)');
                    } else {
                        console.error('✗ Error executing statement:', error.message);
                        throw error;
                    }
                }
            }
        }
        
        console.log('✓ Database migration completed successfully!');
        
        // Create default admin user
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 12);
        
        try {
            await client.query(
                'INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
                ['admin', 'admin@estate.com', adminPassword, 'System Administrator', 'admin']
            );
            console.log('✓ Default admin user created (username: admin, password: admin123)');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠ Admin user already exists');
            } else {
                throw error;
            }
        }
        
        // Create default safe
        try {
            await client.query(
                'INSERT INTO safes (id, name, balance) VALUES ($1, $2, $3)',
                ['S_default', 'الخزنة الرئيسية', 0]
            );
            console.log('✓ Default safe created');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠ Default safe already exists');
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };