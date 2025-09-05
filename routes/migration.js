const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Import data from JSON (exported from IndexedDB)
router.post('/import', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

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
        }
      }

      // Handle settings specially (it's an object, not array)
      if (data.settings && typeof data.settings === 'object') {
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
      }

      await client.query('COMMIT');
      
      res.json({
        message: 'Data imported successfully',
        results
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export data to JSON format (compatible with frontend)
router.get('/export', async (req, res) => {
  try {
    const client = await db.pool.connect();
    try {
      const exportData = {};
      
      // Export all tables
      const tables = [
        'customers', 'units', 'partners', 'unit_partners', 'contracts',
        'installments', 'partner_debts', 'safes', 'transfers', 'audit_log',
        'vouchers', 'broker_dues', 'brokers', 'partner_groups', 'keyval'
      ];

      for (const table of tables) {
        const result = await client.query(`SELECT * FROM ${table}`);
        exportData[table] = result.rows;
      }

      // Export settings
      const settingsResult = await client.query(
        "SELECT value FROM settings WHERE key = 'appSettings'"
      );
      exportData.settings = settingsResult.rows[0]?.value || {};

      res.json(exportData);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Get migration status
router.get('/status', async (req, res) => {
  try {
    const tables = [
      'customers', 'units', 'partners', 'contracts', 'installments',
      'safes', 'transfers', 'audit_log', 'vouchers', 'broker_dues', 'brokers'
    ];

    const status = {};
    for (const table of tables) {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      status[table] = parseInt(result.rows[0].count);
    }

    res.json({
      status: 'ready',
      tableCounts: status,
      totalRecords: Object.values(status).reduce((sum, count) => sum + count, 0)
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check migration status' });
  }
});

// Clear all data (for testing)
router.post('/clear', async (req, res) => {
  try {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const tables = [
        'audit_log', 'vouchers', 'transfers', 'installments', 'contracts',
        'unit_partners', 'partner_debts', 'broker_dues', 'customers',
        'units', 'partners', 'brokers', 'partner_groups', 'safes',
        'settings', 'keyval'
      ];

      for (const table of tables) {
        await client.query(`DELETE FROM ${table}`);
      }

      await client.query('COMMIT');
      
      res.json({ message: 'All data cleared successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

module.exports = router;