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

// Get all contracts
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
            whereClause = `WHERE c.code ILIKE $${paramCount} OR cu.name ILIKE $${paramCount} OR u.code ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM contracts c 
             LEFT JOIN customers cu ON c.customer_id = cu.id 
             LEFT JOIN units u ON c.unit_id = u.id 
             ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total);

        // Get contracts with related data
        const contractsResult = await query(
            `SELECT c.*, cu.name as customer_name, u.code as unit_code, u.name as unit_name
             FROM contracts c 
             LEFT JOIN customers cu ON c.customer_id = cu.id 
             LEFT JOIN units u ON c.unit_id = u.id 
             ${whereClause} 
             ORDER BY c.created_at DESC 
             LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...queryParams, limit, offset]
        );

        res.json({
            contracts: contractsResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get contracts error:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
});

// Get contract by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT c.*, cu.name as customer_name, cu.phone as customer_phone, 
                   u.code as unit_code, u.name as unit_name, u.total_price as unit_price
            FROM contracts c 
            LEFT JOIN customers cu ON c.customer_id = cu.id 
            LEFT JOIN units u ON c.unit_id = u.id 
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({ contract: result.rows[0] });

    } catch (error) {
        console.error('Get contract error:', error);
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
});

// Create new contract
router.post('/', [
    body('unitId').notEmpty().withMessage('Unit ID is required'),
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('totalPrice').isNumeric().withMessage('Total price must be a number'),
    body('downPayment').optional().isNumeric().withMessage('Down payment must be a number'),
    body('discountAmount').optional().isNumeric().withMessage('Discount amount must be a number'),
    body('maintenanceDeposit').optional().isNumeric().withMessage('Maintenance deposit must be a number'),
    body('brokerName').optional().isString().withMessage('Broker name must be a string'),
    body('brokerPercent').optional().isNumeric().withMessage('Broker percent must be a number'),
    body('brokerAmount').optional().isNumeric().withMessage('Broker amount must be a number'),
    body('commissionSafeId').optional().isString().withMessage('Commission safe ID must be a string'),
    body('type').optional().isIn(['cash', 'installment']).withMessage('Type must be cash or installment'),
    body('count').optional().isInt({ min: 1 }).withMessage('Count must be a positive integer'),
    body('extraAnnual').optional().isInt({ min: 0, max: 3 }).withMessage('Extra annual must be between 0 and 3'),
    body('annualPaymentValue').optional().isNumeric().withMessage('Annual payment value must be a number'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            unitId,
            customerId,
            totalPrice,
            downPayment = 0,
            discountAmount = 0,
            maintenanceDeposit = 0,
            brokerName,
            brokerPercent = 0,
            brokerAmount = 0,
            commissionSafeId,
            type = 'cash',
            count = 1,
            extraAnnual = 0,
            annualPaymentValue = 0,
            startDate
        } = req.body;

        // Verify unit and customer exist
        const unitResult = await query('SELECT id, status FROM units WHERE id = $1', [unitId]);
        if (unitResult.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        const customerResult = await query('SELECT id FROM customers WHERE id = $1', [customerId]);
        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Check if unit is available
        if (unitResult.rows[0].status !== 'متاحة') {
            return res.status(400).json({ error: 'Unit is not available for contract' });
        }

        const contractId = generateId('CT');
        const code = 'CTR-' + String(Date.now()).slice(-5);

        const result = await transaction(async (client) => {
            // Create contract
            const contractResult = await client.query(
                `INSERT INTO contracts (id, code, unit_id, customer_id, total_price, down_payment, 
                 discount_amount, maintenance_deposit, broker_name, broker_percent, broker_amount, 
                 commission_safe_id, type, count, extra_annual, annual_payment_value, start_date) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
                 RETURNING *`,
                [contractId, code, unitId, customerId, totalPrice, downPayment, discountAmount,
                 maintenanceDeposit, brokerName, brokerPercent, brokerAmount, commissionSafeId,
                 type, count, extraAnnual, annualPaymentValue, startDate]
            );

            // Update unit status
            await client.query(
                'UPDATE units SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['محجوزة', unitId]
            );

            return contractResult.rows[0];
        });

        res.status(201).json({
            message: 'Contract created successfully',
            contract: result
        });

    } catch (error) {
        console.error('Create contract error:', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
});

// Update contract
router.put('/:id', [
    body('totalPrice').optional().isNumeric().withMessage('Total price must be a number'),
    body('downPayment').optional().isNumeric().withMessage('Down payment must be a number'),
    body('discountAmount').optional().isNumeric().withMessage('Discount amount must be a number'),
    body('maintenanceDeposit').optional().isNumeric().withMessage('Maintenance deposit must be a number'),
    body('brokerName').optional().isString().withMessage('Broker name must be a string'),
    body('brokerPercent').optional().isNumeric().withMessage('Broker percent must be a number'),
    body('brokerAmount').optional().isNumeric().withMessage('Broker amount must be a number'),
    body('commissionSafeId').optional().isString().withMessage('Commission safe ID must be a string'),
    body('type').optional().isIn(['cash', 'installment']).withMessage('Type must be cash or installment'),
    body('count').optional().isInt({ min: 1 }).withMessage('Count must be a positive integer'),
    body('extraAnnual').optional().isInt({ min: 0, max: 3 }).withMessage('Extra annual must be between 0 and 3'),
    body('annualPaymentValue').optional().isNumeric().withMessage('Annual payment value must be a number'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateData = req.body;

        // Check if contract exists
        const existingContract = await query('SELECT id FROM contracts WHERE id = $1', [id]);
        if (existingContract.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                updates.push(`${dbKey} = $${paramCount++}`);
                values.push(updateData[key]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const result = await query(
            `UPDATE contracts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Contract updated successfully',
            contract: result.rows[0]
        });

    } catch (error) {
        console.error('Update contract error:', error);
        res.status(500).json({ error: 'Failed to update contract' });
    }
});

// Delete contract
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await transaction(async (client) => {
            // Get contract details
            const contractResult = await client.query(
                'SELECT unit_id FROM contracts WHERE id = $1',
                [id]
            );

            if (contractResult.rows.length === 0) {
                throw new Error('Contract not found');
            }

            const unitId = contractResult.rows[0].unit_id;

            // Delete contract
            const deleteResult = await client.query(
                'DELETE FROM contracts WHERE id = $1 RETURNING *',
                [id]
            );

            // Update unit status back to available
            await client.query(
                'UPDATE units SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['متاحة', unitId]
            );

            return deleteResult.rows[0];
        });

        res.json({
            message: 'Contract deleted successfully',
            contract: result
        });

    } catch (error) {
        console.error('Delete contract error:', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
});

module.exports = router;