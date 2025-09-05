const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const simpleRoutes = require('./routes/simple');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const unitRoutes = require('./routes/units');
const partnerRoutes = require('./routes/partners');
const contractRoutes = require('./routes/contracts');
const safeRoutes = require('./routes/safes');
const voucherRoutes = require('./routes/vouchers');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    index: 'index.html'
}));

// API Routes - Direct implementation
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./database/connection');

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
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

// Profile endpoint
app.get('/api/auth/profile', async (req, res) => {
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

// Dashboard endpoint
app.get('/api/reports/dashboard', async (req, res) => {
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

// Full API Routes (commented out for now)
// app.use('/api/auth', authRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/units', unitRoutes);
// app.use('/api/partners', partnerRoutes);
// app.use('/api/contracts', contractRoutes);
// app.use('/api/safes', safeRoutes);
// app.use('/api/vouchers', voucherRoutes);
// app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fixed.html'));
});

// Serve the simple application
app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simple.html'));
});

// Serve the original application
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_NAME || 'estate_management'}`);
});

module.exports = app;