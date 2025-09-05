const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Middleware to log actions
const logAction = async (description, details = {}) => {
  try {
    const id = 'LOG-' + Math.random().toString(36).slice(2, 9);
    await db.insert('audit_log', {
      id,
      description,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

// Generic CRUD operations for all entities
const createCrudRoutes = (entityName, tableName) => {
  // Get all records
  router.get(`/${entityName}`, async (req, res) => {
    try {
      const { page = 1, limit = 100, ...filters } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      let paramCount = 0;

      // Add filters
      if (Object.keys(filters).length > 0) {
        const whereClause = Object.keys(filters).map(key => {
          paramCount++;
          return `${key} = $${paramCount}`;
        }).join(' AND ');
        query += ` WHERE ${whereClause}`;
        params.push(...Object.values(filters));
      }

      // Add pagination
      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      
      // Get total count
      let countQuery = `SELECT COUNT(*) FROM ${tableName}`;
      if (Object.keys(filters).length > 0) {
        const whereClause = Object.keys(filters).map(key => {
          return `${key} = $${Object.keys(filters).indexOf(key) + 1}`;
        }).join(' AND ');
        countQuery += ` WHERE ${whereClause}`;
      }
      
      const countResult = await db.query(countQuery, Object.values(filters));
      const total = parseInt(countResult.rows[0].count);

      res.json({
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      // Return empty data if database is not connected
      return res.json({
        data: [],
        pagination: {
          page: parseInt(req.query.page || 1),
          limit: parseInt(req.query.limit || 100),
          total: 0,
          pages: 0
        }
      });
    }
  });

  // Get single record
  router.get(`/${entityName}/:id`, async (req, res) => {
    try {
      const record = await db.getById(tableName, req.params.id);
      if (!record) {
        return res.status(404).json({ error: `${entityName} not found` });
      }
      res.json(record);
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  // Create new record
  router.post(`/${entityName}`, async (req, res) => {
    try {
      const record = await db.insert(tableName, req.body);
      await logAction(`Created ${entityName}`, { id: record.id, data: req.body });
      res.status(201).json(record);
    } catch (error) {
      console.error(`Error creating ${entityName}:`, error);
      res.status(500).json({ error: `Failed to create ${entityName}` });
    }
  });

  // Update record
  router.put(`/${entityName}/:id`, async (req, res) => {
    try {
      const record = await db.update(tableName, req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ error: `${entityName} not found` });
      }
      await logAction(`Updated ${entityName}`, { id: req.params.id, data: req.body });
      res.json(record);
    } catch (error) {
      console.error(`Error updating ${entityName}:`, error);
      res.status(500).json({ error: `Failed to update ${entityName}` });
    }
  });

  // Delete record
  router.delete(`/${entityName}/:id`, async (req, res) => {
    try {
      const record = await db.delete(tableName, req.params.id);
      if (!record) {
        return res.status(404).json({ error: `${entityName} not found` });
      }
      await logAction(`Deleted ${entityName}`, { id: req.params.id });
      res.json({ message: `${entityName} deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      res.status(500).json({ error: `Failed to delete ${entityName}` });
    }
  });
};

// Create CRUD routes for all entities
const entities = [
  { name: 'customers', table: 'customers' },
  { name: 'units', table: 'units' },
  { name: 'partners', table: 'partners' },
  { name: 'unit-partners', table: 'unit_partners' },
  { name: 'contracts', table: 'contracts' },
  { name: 'installments', table: 'installments' },
  { name: 'partner-debts', table: 'partner_debts' },
  { name: 'safes', table: 'safes' },
  { name: 'transfers', table: 'transfers' },
  { name: 'vouchers', table: 'vouchers' },
  { name: 'broker-dues', table: 'broker_dues' },
  { name: 'brokers', table: 'brokers' },
  { name: 'partner-groups', table: 'partner_groups' },
  { name: 'settings', table: 'settings' },
  { name: 'keyval', table: 'keyval' }
];

entities.forEach(entity => {
  createCrudRoutes(entity.name, entity.table);
});

// Special endpoints for complex operations

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [
      customersResult,
      unitsResult,
      contractsResult,
      installmentsResult,
      safesResult
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM customers'),
      db.query('SELECT COUNT(*) as count, status FROM units GROUP BY status'),
      db.query('SELECT COUNT(*) as count FROM contracts'),
      db.query(`
        SELECT 
          COUNT(*) as total_installments,
          SUM(amount) as total_amount,
          COUNT(CASE WHEN status = 'مدفوع' THEN 1 END) as paid_count,
          SUM(CASE WHEN status = 'مدفوع' THEN amount ELSE 0 END) as paid_amount
        FROM installments
      `),
      db.query('SELECT SUM(balance) as total_balance FROM safes')
    ]);

    const unitStats = unitsResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    res.json({
      customers: parseInt(customersResult.rows[0].count),
      units: unitStats,
      contracts: parseInt(contractsResult.rows[0].count),
      installments: installmentsResult.rows[0],
      totalSafesBalance: parseFloat(safesResult.rows[0].total_balance || 0)
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get audit log
router.get('/audit-log', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await db.query(`
      SELECT * FROM audit_log 
      ORDER BY timestamp DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await db.query('SELECT COUNT(*) FROM audit_log');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Bulk operations
router.post('/bulk-insert', async (req, res) => {
  try {
    const { tableName, data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data must be a non-empty array' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const item of data) {
        const keys = Object.keys(item);
        const values = Object.values(item);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
          INSERT INTO ${tableName} (${keys.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      await logAction(`Bulk insert into ${tableName}`, { count: data.length });
      
      res.json({ 
        message: `Successfully inserted ${results.length} records`,
        data: results 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in bulk insert:', error);
    res.status(500).json({ error: 'Failed to perform bulk insert' });
  }
});

module.exports = router;