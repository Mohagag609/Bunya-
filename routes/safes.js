const express = require('express');
const { body, validationResult } = require('express-validator');
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

// Get all safes
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM safes ORDER BY created_at ASC');
        res.json({ safes: result.rows });
    } catch (error) {
        console.error('Get safes error:', error);
        res.status(500).json({ error: 'Failed to fetch safes' });
    }
});

// Get safe by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM safes WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Safe not found' });
        }
        
        res.json({ safe: result.rows[0] });
    } catch (error) {
        console.error('Get safe error:', error);
        res.status(500).json({ error: 'Failed to fetch safe' });
    }
});

// Create new safe
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('balance').optional().isNumeric().withMessage('Balance must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, balance = 0 } = req.body;
        const safeId = generateId('S');

        const result = await query(
            'INSERT INTO safes (id, name, balance) VALUES ($1, $2, $3) RETURNING *',
            [safeId, name, balance]
        );

        res.status(201).json({
            message: 'Safe created successfully',
            safe: result.rows[0]
        });
    } catch (error) {
        console.error('Create safe error:', error);
        res.status(500).json({ error: 'Failed to create safe' });
    }
});

// Update safe
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('balance').optional().isNumeric().withMessage('Balance must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, balance } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (balance !== undefined) {
            updates.push(`balance = $${paramCount++}`);
            values.push(balance);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const result = await query(
            `UPDATE safes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Safe not found' });
        }

        res.json({
            message: 'Safe updated successfully',
            safe: result.rows[0]
        });
    } catch (error) {
        console.error('Update safe error:', error);
        res.status(500).json({ error: 'Failed to update safe' });
    }
});

// Delete safe
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if safe has vouchers
        const vouchersResult = await query(
            'SELECT COUNT(*) as count FROM vouchers WHERE safe_id = $1',
            [id]
        );

        if (parseInt(vouchersResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete safe with existing vouchers. Please delete vouchers first.' 
            });
        }

        const result = await query('DELETE FROM safes WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Safe not found' });
        }

        res.json({
            message: 'Safe deleted successfully',
            safe: result.rows[0]
        });
    } catch (error) {
        console.error('Delete safe error:', error);
        res.status(500).json({ error: 'Failed to delete safe' });
    }
});

module.exports = router;