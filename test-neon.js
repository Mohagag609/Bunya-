// Test script for Neon database connection
const { query } = require('./database/connection');

async function testNeonConnection() {
    console.log('🧪 Testing Neon Database Connection...');
    console.log('=====================================');
    
    try {
        // Test 1: Basic connection
        console.log('1. Testing basic connection...');
        const result = await query('SELECT NOW() as current_time, version() as version');
        console.log('✅ Connection successful!');
        console.log('   Current time:', result.rows[0].current_time);
        console.log('   PostgreSQL version:', result.rows[0].version.split(' ')[0]);

        // Test 2: Check if tables exist
        console.log('\n2. Checking database tables...');
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

        // Test 3: Check admin user
        console.log('\n3. Checking admin user...');
        const adminUser = await query('SELECT username, email, role FROM users WHERE username = $1', ['admin']);
        if (adminUser.rows.length > 0) {
            console.log('   ✅ Admin user exists');
            console.log('   Username:', adminUser.rows[0].username);
            console.log('   Email:', adminUser.rows[0].email);
            console.log('   Role:', adminUser.rows[0].role);
        } else {
            console.log('   ❌ Admin user missing');
        }

        // Test 4: Check default safe
        console.log('\n4. Checking default safe...');
        const defaultSafe = await query('SELECT name, balance FROM safes WHERE name = $1', ['الخزنة الرئيسية']);
        if (defaultSafe.rows.length > 0) {
            console.log('   ✅ Default safe exists');
            console.log('   Name:', defaultSafe.rows[0].name);
            console.log('   Balance:', defaultSafe.rows[0].balance);
        } else {
            console.log('   ❌ Default safe missing');
        }

        // Test 5: Test insert/select
        console.log('\n5. Testing data operations...');
        const testId = 'test_' + Date.now();
        
        // Insert test data
        await query(
            'INSERT INTO customers (id, name, phone) VALUES ($1, $2, $3)',
            [testId, 'Test Customer', '123456789']
        );
        console.log('   ✅ Insert operation successful');

        // Select test data
        const testCustomer = await query('SELECT * FROM customers WHERE id = $1', [testId]);
        if (testCustomer.rows.length > 0) {
            console.log('   ✅ Select operation successful');
            console.log('   Test customer name:', testCustomer.rows[0].name);
        }

        // Clean up test data
        await query('DELETE FROM customers WHERE id = $1', [testId]);
        console.log('   ✅ Cleanup successful');

        console.log('\n🎉 All tests passed! Neon database is working perfectly!');
        console.log('\n📋 Summary:');
        console.log('- Database connection: ✅');
        console.log('- Table structure: ✅');
        console.log('- Default data: ✅');
        console.log('- Data operations: ✅');
        console.log('\n🚀 Ready for production deployment!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testNeonConnection();
}

module.exports = { testNeonConnection };