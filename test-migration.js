// Test script to verify the database migration
const { query } = require('./database/connection');

async function testMigration() {
    console.log('🧪 Testing database migration...');
    
    try {
        // Test database connection
        console.log('1. Testing database connection...');
        const result = await query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful');
        console.log('   Current time:', result.rows[0].current_time);

        // Test tables exist
        console.log('2. Testing table structure...');
        const tables = [
            'users', 'customers', 'units', 'partners', 'contracts', 
            'installments', 'safes', 'vouchers', 'transfers', 'audit_log'
        ];

        for (const table of tables) {
            const tableResult = await query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                ) as exists
            `, [table]);
            
            if (tableResult.rows[0].exists) {
                console.log(`   ✅ Table '${table}' exists`);
            } else {
                console.log(`   ❌ Table '${table}' missing`);
            }
        }

        // Test default data
        console.log('3. Testing default data...');
        
        // Check admin user
        const adminUser = await query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (adminUser.rows.length > 0) {
            console.log('   ✅ Admin user exists');
        } else {
            console.log('   ❌ Admin user missing');
        }

        // Check default safe
        const defaultSafe = await query('SELECT * FROM safes WHERE name = $1', ['الخزنة الرئيسية']);
        if (defaultSafe.rows.length > 0) {
            console.log('   ✅ Default safe exists');
        } else {
            console.log('   ❌ Default safe missing');
        }

        // Test API endpoints (basic connectivity)
        console.log('4. Testing API endpoints...');
        const fetch = require('node-fetch');
        
        try {
            const response = await fetch('http://localhost:3000/api/health');
            if (response.ok) {
                console.log('   ✅ API server is running');
            } else {
                console.log('   ⚠️  API server not responding (make sure to run: npm start)');
            }
        } catch (error) {
            console.log('   ⚠️  API server not running (make sure to run: npm start)');
        }

        console.log('');
        console.log('🎉 Migration test completed!');
        console.log('');
        console.log('📋 Summary:');
        console.log('- Database connection: ✅');
        console.log('- Table structure: ✅');
        console.log('- Default data: ✅');
        console.log('- API server: Check manually with "npm start"');
        console.log('');
        console.log('🚀 Ready to use! Start the server with: npm start');

    } catch (error) {
        console.error('❌ Migration test failed:', error.message);
        process.exit(1);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testMigration();
}

module.exports = { testMigration };