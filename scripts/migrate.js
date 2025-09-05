const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function migrateFromFile(filePath) {
  try {
    console.log('Starting migration from file:', filePath);
    
    // Read JSON file
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonData);
    
    console.log('Data loaded from file');
    console.log('Tables found:', Object.keys(data));
    
    // Initialize database
    await db.initialize();
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const results = {};
      const tableMappings = {
        customers: 'customers',
        units: 'units',
        partners: 'partners',
        unitPartners: 'unit_partners',
        contracts: 'contracts',
        installments: 'installments',
        partnerDebts: 'partner_debts',
        safes: 'safes',
        transfers: 'transfers',
        auditLog: 'audit_log',
        vouchers: 'vouchers',
        brokerDues: 'broker_dues',
        brokers: 'brokers',
        partnerGroups: 'partner_groups',
        settings: 'settings',
        keyval: 'keyval'
      };

      // Process each table
      for (const [frontendTable, dbTable] of Object.entries(tableMappings)) {
        if (data[frontendTable] && Array.isArray(data[frontendTable])) {
          console.log(`Migrating ${frontendTable} to ${dbTable}...`);
          
          // Clear existing data
          await client.query(`DELETE FROM ${dbTable}`);
          
          // Insert new data
          let insertedCount = 0;
          for (const item of data[frontendTable]) {
            if (item && typeof item === 'object' && item.id) {
              const keys = Object.keys(item);
              const values = Object.values(item);
              const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
              
              const query = `
                INSERT INTO ${dbTable} (${keys.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET
                ${keys.filter(key => key !== 'id').map(key => `${key} = EXCLUDED.${key}`).join(', ')}
              `;
              
              await client.query(query, values);
              insertedCount++;
            }
          }
          
          results[frontendTable] = {
            table: dbTable,
            inserted: insertedCount
          };
          
          console.log(`✓ Migrated ${insertedCount} records to ${dbTable}`);
        }
      }

      // Handle settings specially (it's an object, not array)
      if (data.settings && typeof data.settings === 'object') {
        console.log('Migrating settings...');
        await client.query(`DELETE FROM settings WHERE key = 'appSettings'`);
        await client.query(`
          INSERT INTO settings (key, value) 
          VALUES ('appSettings', $1)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [JSON.stringify(data.settings)]);
        
        results.settings = {
          table: 'settings',
          inserted: 1
        };
        console.log('✓ Migrated settings');
      }

      await client.query('COMMIT');
      
      console.log('\nMigration completed successfully!');
      console.log('Results:', results);
      
      const totalRecords = Object.values(results).reduce((sum, result) => sum + result.inserted, 0);
      console.log(`Total records migrated: ${totalRecords}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('Usage: node scripts/migrate.js <path-to-json-file>');
    console.log('Example: node scripts/migrate.js ./data-export.json');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  
  await migrateFromFile(filePath);
  process.exit(0);
}

main();