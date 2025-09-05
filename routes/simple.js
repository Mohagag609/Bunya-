const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

const router = express.Router();

// Simple login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if user exists
        const result = await query(
            'SELECT id, username, email, password_hash, full_name, role FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await query(
            'SELECT id, username, email, full_name, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Get dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const [
            customersCount,
            unitsCount,
            contractsCount,
            totalRevenue,
            safesBalance
        ] = await Promise.all([
            query('SELECT COUNT(*) as count FROM customers'),
            query('SELECT COUNT(*) as count FROM units'),
            query('SELECT COUNT(*) as count FROM contracts'),
            query('SELECT COALESCE(SUM(amount), 0) as total FROM vouchers WHERE type = $1', ['receipt']),
            query('SELECT COALESCE(SUM(balance), 0) as total FROM safes')
        ]);

        res.json({
            summary: {
                customersCount: parseInt(customersCount.rows[0].count),
                unitsCount: parseInt(unitsCount.rows[0].count),
                contractsCount: parseInt(contractsCount.rows[0].count),
                totalRevenue: parseFloat(totalRevenue.rows[0].total),
                safesBalance: parseFloat(safesBalance.rows[0].total)
            },
            recentContracts: [],
            recentVouchers: []
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;