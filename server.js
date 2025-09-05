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

// Customers API
app.get('/api/customers', async (req, res) => {
    try {
        const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
        res.json({ customers: result.rows });
    } catch (error) {
        console.error('Customers fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { name, phone, national_id, address, status, notes } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        const result = await query(
            'INSERT INTO customers (id, name, phone, national_id, address, status, notes) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING *',
            [name, phone, national_id || null, address || null, status || 'active', notes || null]
        );

        res.status(201).json({ customer: result.rows[0] });
    } catch (error) {
        console.error('Customer creation error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, national_id, address, status, notes } = req.body;
        
        const result = await query(
            'UPDATE customers SET name = $1, phone = $2, national_id = $3, address = $4, status = $5, notes = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
            [name, phone, national_id, address, status, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer: result.rows[0] });
    } catch (error) {
        console.error('Customer update error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Customer deletion error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Units API
app.get('/api/units', async (req, res) => {
    try {
        const result = await query(`
            SELECT u.*, p.name as partner_name 
            FROM units u 
            LEFT JOIN partners p ON u.partner_id = p.id 
            ORDER BY u.created_at DESC
        `);
        res.json({ units: result.rows });
    } catch (error) {
        console.error('Units fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch units' });
    }
});

app.post('/api/units', async (req, res) => {
    try {
        const { name, type, area, price, location, partner_id, status, notes } = req.body;
        
        if (!name || !type || !area || !price) {
            return res.status(400).json({ error: 'Name, type, area, and price are required' });
        }

        const result = await query(
            'INSERT INTO units (name, type, area, price, location, partner_id, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, type, area, price, location || null, partner_id || null, status || 'available', notes || null]
        );

        res.status(201).json({ unit: result.rows[0] });
    } catch (error) {
        console.error('Unit creation error:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

// Partners API
app.get('/api/partners', async (req, res) => {
    try {
        const result = await query('SELECT * FROM partners ORDER BY created_at DESC');
        res.json({ partners: result.rows });
    } catch (error) {
        console.error('Partners fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

app.post('/api/partners', async (req, res) => {
    try {
        const { name, phone, email, address, share_percentage, notes } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        const result = await query(
            'INSERT INTO partners (name, phone, email, address, share_percentage, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, phone, email || null, address || null, share_percentage || 0, notes || null]
        );

        res.status(201).json({ partner: result.rows[0] });
    } catch (error) {
        console.error('Partner creation error:', error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
});

// Safes API
app.get('/api/safes', async (req, res) => {
    try {
        const result = await query('SELECT * FROM safes ORDER BY created_at DESC');
        res.json({ safes: result.rows });
    } catch (error) {
        console.error('Safes fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch safes' });
    }
});

app.post('/api/safes', async (req, res) => {
    try {
        const { name, balance, currency, notes } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await query(
            'INSERT INTO safes (name, balance, currency, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, balance || 0, currency || 'EGP', notes || null]
        );

        res.status(201).json({ safe: result.rows[0] });
    } catch (error) {
        console.error('Safe creation error:', error);
        res.status(500).json({ error: 'Failed to create safe' });
    }
});

// Vouchers API
app.get('/api/vouchers', async (req, res) => {
    try {
        const result = await query(`
            SELECT v.*, s.name as safe_name, c.name as customer_name 
            FROM vouchers v 
            LEFT JOIN safes s ON v.safe_id = s.id 
            LEFT JOIN customers c ON v.customer_id = c.id 
            ORDER BY v.created_at DESC
        `);
        res.json({ vouchers: result.rows });
    } catch (error) {
        console.error('Vouchers fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
});

app.post('/api/vouchers', async (req, res) => {
    try {
        const { type, amount, description, safe_id, customer_id, notes } = req.body;
        
        if (!type || !amount || !safe_id) {
            return res.status(400).json({ error: 'Type, amount, and safe are required' });
        }

        const result = await query(
            'INSERT INTO vouchers (type, amount, description, safe_id, customer_id, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [type, amount, description || null, safe_id, customer_id || null, notes || null]
        );

        res.status(201).json({ voucher: result.rows[0] });
    } catch (error) {
        console.error('Voucher creation error:', error);
        res.status(500).json({ error: 'Failed to create voucher' });
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
    res.sendFile(path.join(__dirname, 'public', 'real.html'));
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