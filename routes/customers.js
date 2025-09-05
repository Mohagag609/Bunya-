const express = require('express');
const { body, validationResult, query: validateQuery } = require('express-validator');
const { query, transaction } = require('../database/connection');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and logging to all routes
router.use(authenticateToken);
router.use(logAction);

// Generate unique ID helper
const generateId = (prefix) => {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all customers with pagination and search
router.get('/', [
    validateQuery('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    validateQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateQuery('search').optional().isString().withMessage('Search must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let whereClause = '';
        let queryParams = [];
        let paramCount = 1;

        if (search) {
            whereClause = `WHERE name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR national_id ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM customers ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total);

        // Get customers
        const customersResult = await query(
            `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...queryParams, limit, offset]
        );

        res.json({
            customers: customersResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT * FROM customers WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer: result.rows[0] });

    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Create new customer
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('nationalId').optional().isString().withMessage('National ID must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('status').optional().isIn(['نشط', 'غير نشط']).withMessage('Status must be either نشط or غير نشط'),
    body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, nationalId, address, status = 'نشط', notes } = req.body;

        // Check if customer with same national ID already exists
        if (nationalId) {
            const existingCustomer = await query(
                'SELECT id FROM customers WHERE national_id = $1',
                [nationalId]
            );
            if (existingCustomer.rows.length > 0) {
                return res.status(400).json({ error: 'Customer with this national ID already exists' });
            }
        }

        const customerId = generateId('C');

        const result = await query(
            'INSERT INTO customers (id, name, phone, national_id, address, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [customerId, name, phone, nationalId, address, status, notes]
        );

        res.status(201).json({
            message: 'Customer created successfully',
            customer: result.rows[0]
        });

    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('nationalId').optional().isString().withMessage('National ID must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('status').optional().isIn(['نشط', 'غير نشط']).withMessage('Status must be either نشط or غير نشط'),
    body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, phone, nationalId, address, status, notes } = req.body;

        // Check if customer exists
        const existingCustomer = await query(
            'SELECT id FROM customers WHERE id = $1',
            [id]
        );

        if (existingCustomer.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Check if national ID is already taken by another customer
        if (nationalId) {
            const duplicateCustomer = await query(
                'SELECT id FROM customers WHERE national_id = $1 AND id != $2',
                [nationalId, id]
            );
            if (duplicateCustomer.rows.length > 0) {
                return res.status(400).json({ error: 'National ID already in use by another customer' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (nationalId !== undefined) {
            updates.push(`national_id = $${paramCount++}`);
            values.push(nationalId);
        }
        if (address !== undefined) {
            updates.push(`address = $${paramCount++}`);
            values.push(address);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramCount++}`);
            values.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const result = await query(
            `UPDATE customers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Customer updated successfully',
            customer: result.rows[0]
        });

    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer has contracts
        const contractsResult = await query(
            'SELECT COUNT(*) as count FROM contracts WHERE customer_id = $1',
            [id]
        );

        if (parseInt(contractsResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with existing contracts. Please delete contracts first.' 
            });
        }

        const result = await query(
            'DELETE FROM customers WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({
            message: 'Customer deleted successfully',
            customer: result.rows[0]
        });

    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Bulk import customers from CSV
router.post('/import', [
    body('customers').isArray().withMessage('Customers must be an array'),
    body('customers.*.name').notEmpty().withMessage('Each customer must have a name'),
    body('customers.*.phone').optional().isString(),
    body('customers.*.nationalId').optional().isString(),
    body('customers.*.address').optional().isString(),
    body('customers.*.status').optional().isIn(['نشط', 'غير نشط']),
    body('customers.*.notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { customers } = req.body;

        const results = await transaction(async (client) => {
            const createdCustomers = [];
            const errors = [];

            for (let i = 0; i < customers.length; i++) {
                const customer = customers[i];
                
                try {
                    // Check for duplicate national ID
                    if (customer.nationalId) {
                        const existingCustomer = await client.query(
                            'SELECT id FROM customers WHERE national_id = $1',
                            [customer.nationalId]
                        );
                        if (existingCustomer.rows.length > 0) {
                            errors.push(`Row ${i + 1}: Customer with national ID ${customer.nationalId} already exists`);
                            continue;
                        }
                    }

                    const customerId = generateId('C');
                    const result = await client.query(
                        'INSERT INTO customers (id, name, phone, national_id, address, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                        [customerId, customer.name, customer.phone, customer.nationalId, customer.address, customer.status || 'نشط', customer.notes]
                    );

                    createdCustomers.push(result.rows[0]);
                } catch (error) {
                    errors.push(`Row ${i + 1}: ${error.message}`);
                }
            }

            return { createdCustomers, errors };
        });

        res.json({
            message: `Import completed. ${results.createdCustomers.length} customers created.`,
            created: results.createdCustomers,
            errors: results.errors
        });

    } catch (error) {
        console.error('Import customers error:', error);
        res.status(500).json({ error: 'Failed to import customers' });
    }
});

module.exports = router;