const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists and is active
        const result = await query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(401).json({ error: 'User account is disabled' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to check user role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Middleware to log user actions
const logAction = async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Log the action if it was successful (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const action = `${req.method} ${req.originalUrl}`;
            const description = `${req.method} request to ${req.originalUrl}`;
            
            // Log asynchronously without blocking the response
            setImmediate(async () => {
                try {
                    await query(
                        'INSERT INTO audit_log (user_id, action, description, details) VALUES ($1, $2, $3, $4)',
                        [
                            req.user?.id || null,
                            action,
                            description,
                            JSON.stringify({
                                method: req.method,
                                url: req.originalUrl,
                                ip: req.ip,
                                userAgent: req.get('User-Agent'),
                                timestamp: new Date().toISOString()
                            })
                        ]
                    );
                } catch (error) {
                    console.error('Failed to log action:', error);
                }
            });
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    logAction
};