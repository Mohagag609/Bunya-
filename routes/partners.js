const express = require('express');
const { body, validationResult, query: validateQuery } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and logging to all routes
router.use(authenticateToken);
router.use(logAction);

// Generate unique ID helper
const generateId = (prefix) => {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all partners
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
            whereClause = `WHERE name ILIKE $${paramCount} OR phone ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM partners ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total);

        // Get partners
        const partnersResult = await query(
            `SELECT * FROM partners ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...queryParams, limit, offset]
        );

        res.json({
            partners: partnersResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get partners error:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// Get partner by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT * FROM partners WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        res.json({ partner: result.rows[0] });

    } catch (error) {
        console.error('Get partner error:', error);
        res.status(500).json({ error: 'Failed to fetch partner' });
    }
});

// Create new partner
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').optional().isString().withMessage('Phone must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone } = req.body;

        // Check if partner with same name already exists
        const existingPartner = await query(
            'SELECT id FROM partners WHERE name = $1',
            [name]
        );
        if (existingPartner.rows.length > 0) {
            return res.status(400).json({ error: 'Partner with this name already exists' });
        }

        const partnerId = generateId('PR');

        const result = await query(
            'INSERT INTO partners (id, name, phone) VALUES ($1, $2, $3) RETURNING *',
            [partnerId, name, phone]
        );

        res.status(201).json({
            message: 'Partner created successfully',
            partner: result.rows[0]
        });

    } catch (error) {
        console.error('Create partner error:', error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
});

// Update partner
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isString().withMessage('Phone must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, phone } = req.body;

        // Check if partner exists
        const existingPartner = await query(
            'SELECT id FROM partners WHERE id = $1',
            [id]
        );

        if (existingPartner.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // Check if name is already taken by another partner
        if (name) {
            const duplicatePartner = await query(
                'SELECT id FROM partners WHERE name = $1 AND id != $2',
                [name, id]
            );
            if (duplicatePartner.rows.length > 0) {
                return res.status(400).json({ error: 'Partner name already in use by another partner' });
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

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const result = await query(
            `UPDATE partners SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Partner updated successfully',
            partner: result.rows[0]
        });

    } catch (error) {
        console.error('Update partner error:', error);
        res.status(500).json({ error: 'Failed to update partner' });
    }
});

// Delete partner
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if partner has unit partnerships
        const partnershipsResult = await query(
            'SELECT COUNT(*) as count FROM unit_partners WHERE partner_id = $1',
            [id]
        );

        if (parseInt(partnershipsResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete partner with existing unit partnerships. Please remove partnerships first.' 
            });
        }

        const result = await query(
            'DELETE FROM partners WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        res.json({
            message: 'Partner deleted successfully',
            partner: result.rows[0]
        });

    } catch (error) {
        console.error('Delete partner error:', error);
        res.status(500).json({ error: 'Failed to delete partner' });
    }
});

module.exports = router;