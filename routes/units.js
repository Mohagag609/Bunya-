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

// Get all units with pagination and search
router.get('/', [
    validateQuery('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    validateQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateQuery('search').optional().isString().withMessage('Search must be a string'),
    validateQuery('status').optional().isIn(['متاحة', 'محجوزة', 'مباعة']).withMessage('Invalid status'),
    validateQuery('unitType').optional().isIn(['سكني', 'تجاري', 'إداري']).withMessage('Invalid unit type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const status = req.query.status;
        const unitType = req.query.unitType;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];
        let paramCount = 1;

        if (search) {
            whereConditions.push(`(name ILIKE $${paramCount} OR code ILIKE $${paramCount} OR building ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        if (status) {
            whereConditions.push(`status = $${paramCount}`);
            queryParams.push(status);
            paramCount++;
        }

        if (unitType) {
            whereConditions.push(`unit_type = $${paramCount}`);
            queryParams.push(unitType);
            paramCount++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM units ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total);

        // Get units
        const unitsResult = await query(
            `SELECT * FROM units ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...queryParams, limit, offset]
        );

        res.json({
            units: unitsResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get units error:', error);
        res.status(500).json({ error: 'Failed to fetch units' });
    }
});

// Get unit by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT * FROM units WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        res.json({ unit: result.rows[0] });

    } catch (error) {
        console.error('Get unit error:', error);
        res.status(500).json({ error: 'Failed to fetch unit' });
    }
});

// Create new unit
router.post('/', [
    body('code').notEmpty().withMessage('Code is required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('status').optional().isIn(['متاحة', 'محجوزة', 'مباعة']).withMessage('Invalid status'),
    body('area').optional().isString().withMessage('Area must be a string'),
    body('floor').optional().isString().withMessage('Floor must be a string'),
    body('building').optional().isString().withMessage('Building must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('totalPrice').optional().isNumeric().withMessage('Total price must be a number'),
    body('unitType').optional().isIn(['سكني', 'تجاري', 'إداري']).withMessage('Invalid unit type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            code, 
            name, 
            status = 'متاحة', 
            area, 
            floor, 
            building, 
            notes, 
            totalPrice = 0, 
            unitType = 'سكني' 
        } = req.body;

        // Check if unit code already exists
        const existingUnit = await query(
            'SELECT id FROM units WHERE code = $1',
            [code]
        );
        if (existingUnit.rows.length > 0) {
            return res.status(400).json({ error: 'Unit code already exists' });
        }

        const unitId = generateId('U');

        const result = await query(
            'INSERT INTO units (id, code, name, status, area, floor, building, notes, total_price, unit_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [unitId, code, name, status, area, floor, building, notes, totalPrice, unitType]
        );

        res.status(201).json({
            message: 'Unit created successfully',
            unit: result.rows[0]
        });

    } catch (error) {
        console.error('Create unit error:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

// Update unit
router.put('/:id', [
    body('code').optional().notEmpty().withMessage('Code cannot be empty'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('status').optional().isIn(['متاحة', 'محجوزة', 'مباعة']).withMessage('Invalid status'),
    body('area').optional().isString().withMessage('Area must be a string'),
    body('floor').optional().isString().withMessage('Floor must be a string'),
    body('building').optional().isString().withMessage('Building must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('totalPrice').optional().isNumeric().withMessage('Total price must be a number'),
    body('unitType').optional().isIn(['سكني', 'تجاري', 'إداري']).withMessage('Invalid unit type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { 
            code, 
            name, 
            status, 
            area, 
            floor, 
            building, 
            notes, 
            totalPrice, 
            unitType 
        } = req.body;

        // Check if unit exists
        const existingUnit = await query(
            'SELECT id FROM units WHERE id = $1',
            [id]
        );

        if (existingUnit.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        // Check if code is already taken by another unit
        if (code) {
            const duplicateUnit = await query(
                'SELECT id FROM units WHERE code = $1 AND id != $2',
                [code, id]
            );
            if (duplicateUnit.rows.length > 0) {
                return res.status(400).json({ error: 'Unit code already in use by another unit' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (code !== undefined) {
            updates.push(`code = $${paramCount++}`);
            values.push(code);
        }
        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (area !== undefined) {
            updates.push(`area = $${paramCount++}`);
            values.push(area);
        }
        if (floor !== undefined) {
            updates.push(`floor = $${paramCount++}`);
            values.push(floor);
        }
        if (building !== undefined) {
            updates.push(`building = $${paramCount++}`);
            values.push(building);
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramCount++}`);
            values.push(notes);
        }
        if (totalPrice !== undefined) {
            updates.push(`total_price = $${paramCount++}`);
            values.push(totalPrice);
        }
        if (unitType !== undefined) {
            updates.push(`unit_type = $${paramCount++}`);
            values.push(unitType);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const result = await query(
            `UPDATE units SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Unit updated successfully',
            unit: result.rows[0]
        });

    } catch (error) {
        console.error('Update unit error:', error);
        res.status(500).json({ error: 'Failed to update unit' });
    }
});

// Delete unit
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if unit has contracts
        const contractsResult = await query(
            'SELECT COUNT(*) as count FROM contracts WHERE unit_id = $1',
            [id]
        );

        if (parseInt(contractsResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete unit with existing contracts. Please delete contracts first.' 
            });
        }

        const result = await query(
            'DELETE FROM units WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        res.json({
            message: 'Unit deleted successfully',
            unit: result.rows[0]
        });

    } catch (error) {
        console.error('Delete unit error:', error);
        res.status(500).json({ error: 'Failed to delete unit' });
    }
});

// Get unit partners
router.get('/:id/partners', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT up.*, p.name as partner_name, p.phone as partner_phone
            FROM unit_partners up
            JOIN partners p ON up.partner_id = p.id
            WHERE up.unit_id = $1
            ORDER BY up.percent DESC
        `, [id]);

        res.json({ partners: result.rows });

    } catch (error) {
        console.error('Get unit partners error:', error);
        res.status(500).json({ error: 'Failed to fetch unit partners' });
    }
});

// Add partner to unit
router.post('/:id/partners', [
    body('partnerId').notEmpty().withMessage('Partner ID is required'),
    body('percent').isNumeric().withMessage('Percent must be a number'),
    body('percent').isFloat({ min: 0, max: 100 }).withMessage('Percent must be between 0 and 100')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { partnerId, percent } = req.body;

        // Check if unit exists
        const unitResult = await query('SELECT id FROM units WHERE id = $1', [id]);
        if (unitResult.rows.length === 0) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        // Check if partner exists
        const partnerResult = await query('SELECT id FROM partners WHERE id = $1', [partnerId]);
        if (partnerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // Check if partnership already exists
        const existingPartnership = await query(
            'SELECT id FROM unit_partners WHERE unit_id = $1 AND partner_id = $2',
            [id, partnerId]
        );
        if (existingPartnership.rows.length > 0) {
            return res.status(400).json({ error: 'Partnership already exists' });
        }

        const partnershipId = generateId('UP');

        const result = await query(
            'INSERT INTO unit_partners (id, unit_id, partner_id, percent) VALUES ($1, $2, $3, $4) RETURNING *',
            [partnershipId, id, partnerId, percent]
        );

        res.status(201).json({
            message: 'Partner added to unit successfully',
            partnership: result.rows[0]
        });

    } catch (error) {
        console.error('Add unit partner error:', error);
        res.status(500).json({ error: 'Failed to add partner to unit' });
    }
});

// Remove partner from unit
router.delete('/:id/partners/:partnerId', async (req, res) => {
    try {
        const { id, partnerId } = req.params;

        const result = await query(
            'DELETE FROM unit_partners WHERE unit_id = $1 AND partner_id = $2 RETURNING *',
            [id, partnerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partnership not found' });
        }

        res.json({
            message: 'Partner removed from unit successfully',
            partnership: result.rows[0]
        });

    } catch (error) {
        console.error('Remove unit partner error:', error);
        res.status(500).json({ error: 'Failed to remove partner from unit' });
    }
});

module.exports = router;