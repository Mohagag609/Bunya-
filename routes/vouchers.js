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

// Get all vouchers
router.get('/', [
    validateQuery('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    validateQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateQuery('type').optional().isIn(['receipt', 'payment']).withMessage('Type must be receipt or payment'),
    validateQuery('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
    validateQuery('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type;
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramCount = 1;

        if (type) {
            whereConditions.push(`type = $${paramCount}`);
            queryParams.push(type);
            paramCount++;
        }

        if (dateFrom) {
            whereConditions.push(`date >= $${paramCount}`);
            queryParams.push(dateFrom);
            paramCount++;
        }

        if (dateTo) {
            whereConditions.push(`date <= $${paramCount}`);
            queryParams.push(dateTo);
            paramCount++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM vouchers ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total);

        // Get vouchers with safe information
        const vouchersResult = await query(
            `SELECT v.*, s.name as safe_name 
             FROM vouchers v 
             LEFT JOIN safes s ON v.safe_id = s.id 
             ${whereClause} 
             ORDER BY v.date DESC, v.created_at DESC 
             LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...queryParams, limit, offset]
        );

        res.json({
            vouchers: vouchersResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get vouchers error:', error);
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
});

// Get voucher by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT v.*, s.name as safe_name 
            FROM vouchers v 
            LEFT JOIN safes s ON v.safe_id = s.id 
            WHERE v.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        res.json({ voucher: result.rows[0] });

    } catch (error) {
        console.error('Get voucher error:', error);
        res.status(500).json({ error: 'Failed to fetch voucher' });
    }
});

// Create new voucher
router.post('/', [
    body('type').isIn(['receipt', 'payment']).withMessage('Type must be receipt or payment'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('safeId').optional().isString().withMessage('Safe ID must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('payer').optional().isString().withMessage('Payer must be a string'),
    body('beneficiary').optional().isString().withMessage('Beneficiary must be a string'),
    body('linkedRef').optional().isString().withMessage('Linked reference must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            type,
            date,
            amount,
            safeId,
            description,
            payer,
            beneficiary,
            linkedRef
        } = req.body;

        const voucherId = generateId('V');

        const result = await transaction(async (client) => {
            // Create voucher
            const voucherResult = await client.query(
                `INSERT INTO vouchers (id, type, date, amount, safe_id, description, payer, beneficiary, linked_ref) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [voucherId, type, date, amount, safeId, description, payer, beneficiary, linkedRef]
            );

            // Update safe balance if safe is specified
            if (safeId) {
                const balanceChange = type === 'receipt' ? amount : -amount;
                await client.query(
                    'UPDATE safes SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [balanceChange, safeId]
                );
            }

            return voucherResult.rows[0];
        });

        res.status(201).json({
            message: 'Voucher created successfully',
            voucher: result
        });

    } catch (error) {
        console.error('Create voucher error:', error);
        res.status(500).json({ error: 'Failed to create voucher' });
    }
});

// Update voucher
router.put('/:id', [
    body('type').optional().isIn(['receipt', 'payment']).withMessage('Type must be receipt or payment'),
    body('date').optional().isISO8601().withMessage('Date must be a valid date'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('safeId').optional().isString().withMessage('Safe ID must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('payer').optional().isString().withMessage('Payer must be a string'),
    body('beneficiary').optional().isString().withMessage('Beneficiary must be a string'),
    body('linkedRef').optional().isString().withMessage('Linked reference must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateData = req.body;

        // Get current voucher data
        const currentVoucher = await query('SELECT * FROM vouchers WHERE id = $1', [id]);
        if (currentVoucher.rows.length === 0) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        const current = currentVoucher.rows[0];

        const result = await transaction(async (client) => {
            // Revert old safe balance if safe was specified
            if (current.safe_id) {
                const oldBalanceChange = current.type === 'receipt' ? -current.amount : current.amount;
                await client.query(
                    'UPDATE safes SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [oldBalanceChange, current.safe_id]
                );
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
                throw new Error('No fields to update');
            }

            values.push(id);

            // Update voucher
            const voucherResult = await client.query(
                `UPDATE vouchers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
                values
            );

            const updatedVoucher = voucherResult.rows[0];

            // Apply new safe balance if safe is specified
            if (updatedVoucher.safe_id) {
                const newBalanceChange = updatedVoucher.type === 'receipt' ? updatedVoucher.amount : -updatedVoucher.amount;
                await client.query(
                    'UPDATE safes SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [newBalanceChange, updatedVoucher.safe_id]
                );
            }

            return updatedVoucher;
        });

        res.json({
            message: 'Voucher updated successfully',
            voucher: result
        });

    } catch (error) {
        console.error('Update voucher error:', error);
        res.status(500).json({ error: 'Failed to update voucher' });
    }
});

// Delete voucher
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await transaction(async (client) => {
            // Get voucher data
            const voucherResult = await client.query('SELECT * FROM vouchers WHERE id = $1', [id]);
            if (voucherResult.rows.length === 0) {
                throw new Error('Voucher not found');
            }

            const voucher = voucherResult.rows[0];

            // Revert safe balance if safe was specified
            if (voucher.safe_id) {
                const balanceChange = voucher.type === 'receipt' ? -voucher.amount : voucher.amount;
                await client.query(
                    'UPDATE safes SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [balanceChange, voucher.safe_id]
                );
            }

            // Delete voucher
            const deleteResult = await client.query('DELETE FROM vouchers WHERE id = $1 RETURNING *', [id]);
            return deleteResult.rows[0];
        });

        res.json({
            message: 'Voucher deleted successfully',
            voucher: result
        });

    } catch (error) {
        console.error('Delete voucher error:', error);
        res.status(500).json({ error: 'Failed to delete voucher' });
    }
});

module.exports = router;