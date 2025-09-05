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

// API Routes - Simple version first
app.use('/api', simpleRoutes);

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
    res.sendFile(path.join(__dirname, 'public', 'working.html'));
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