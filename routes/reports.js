const express = require('express');
const { query } = require('../database/connection');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and logging to all routes
router.use(authenticateToken);
router.use(logAction);

// Dashboard summary
router.get('/dashboard', async (req, res) => {
    try {
        const [
            customersCount,
            unitsCount,
            contractsCount,
            totalRevenue,
            safesBalance,
            recentContracts,
            recentVouchers
        ] = await Promise.all([
            query('SELECT COUNT(*) as count FROM customers'),
            query('SELECT COUNT(*) as count FROM units'),
            query('SELECT COUNT(*) as count FROM contracts'),
            query('SELECT COALESCE(SUM(amount), 0) as total FROM vouchers WHERE type = $1', ['receipt']),
            query('SELECT COALESCE(SUM(balance), 0) as total FROM safes'),
            query(`
                SELECT c.*, cu.name as customer_name, u.code as unit_code 
                FROM contracts c 
                LEFT JOIN customers cu ON c.customer_id = cu.id 
                LEFT JOIN units u ON c.unit_id = u.id 
                ORDER BY c.created_at DESC 
                LIMIT 5
            `),
            query(`
                SELECT v.*, s.name as safe_name 
                FROM vouchers v 
                LEFT JOIN safes s ON v.safe_id = s.id 
                ORDER BY v.created_at DESC 
                LIMIT 5
            `)
        ]);

        res.json({
            summary: {
                customersCount: parseInt(customersCount.rows[0].count),
                unitsCount: parseInt(unitsCount.rows[0].count),
                contractsCount: parseInt(contractsCount.rows[0].count),
                totalRevenue: parseFloat(totalRevenue.rows[0].total),
                safesBalance: parseFloat(safesBalance.rows[0].total)
            },
            recentContracts: recentContracts.rows,
            recentVouchers: recentVouchers.rows
        });

    } catch (error) {
        console.error('Dashboard report error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Financial summary
router.get('/financial', async (req, res) => {
    try {
        const [
            totalReceipts,
            totalPayments,
            safesBalance,
            vouchersByType,
            monthlyRevenue
        ] = await Promise.all([
            query('SELECT COALESCE(SUM(amount), 0) as total FROM vouchers WHERE type = $1', ['receipt']),
            query('SELECT COALESCE(SUM(amount), 0) as total FROM vouchers WHERE type = $1', ['payment']),
            query('SELECT s.name, s.balance FROM safes ORDER BY s.balance DESC'),
            query(`
                SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
                FROM vouchers 
                GROUP BY type
            `),
            query(`
                SELECT 
                    DATE_TRUNC('month', date) as month,
                    COALESCE(SUM(CASE WHEN type = 'receipt' THEN amount ELSE 0 END), 0) as receipts,
                    COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as payments
                FROM vouchers 
                WHERE date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', date)
                ORDER BY month DESC
            `)
        ]);

        res.json({
            totalReceipts: parseFloat(totalReceipts.rows[0].total),
            totalPayments: parseFloat(totalPayments.rows[0].total),
            netIncome: parseFloat(totalReceipts.rows[0].total) - parseFloat(totalPayments.rows[0].total),
            safesBalance: safesBalance.rows,
            vouchersByType: vouchersByType.rows,
            monthlyRevenue: monthlyRevenue.rows
        });

    } catch (error) {
        console.error('Financial report error:', error);
        res.status(500).json({ error: 'Failed to fetch financial data' });
    }
});

// Units report
router.get('/units', async (req, res) => {
    try {
        const [
            unitsByStatus,
            unitsByType,
            unitsWithContracts,
            averagePrice
        ] = await Promise.all([
            query(`
                SELECT status, COUNT(*) as count 
                FROM units 
                GROUP BY status
            `),
            query(`
                SELECT unit_type, COUNT(*) as count, COALESCE(AVG(total_price), 0) as avg_price 
                FROM units 
                GROUP BY unit_type
            `),
            query(`
                SELECT 
                    u.*,
                    CASE WHEN c.id IS NOT NULL THEN 'متعاقد عليها' ELSE 'متاحة' END as contract_status
                FROM units u
                LEFT JOIN contracts c ON u.id = c.unit_id
                ORDER BY u.created_at DESC
            `),
            query('SELECT COALESCE(AVG(total_price), 0) as avg FROM units WHERE total_price > 0')
        ]);

        res.json({
            unitsByStatus: unitsByStatus.rows,
            unitsByType: unitsByType.rows,
            unitsWithContracts: unitsWithContracts.rows,
            averagePrice: parseFloat(averagePrice.rows[0].avg)
        });

    } catch (error) {
        console.error('Units report error:', error);
        res.status(500).json({ error: 'Failed to fetch units data' });
    }
});

// Contracts report
router.get('/contracts', async (req, res) => {
    try {
        const [
            contractsByType,
            contractsByMonth,
            topCustomers,
            contractDetails
        ] = await Promise.all([
            query(`
                SELECT type, COUNT(*) as count, COALESCE(SUM(total_price), 0) as total_value 
                FROM contracts 
                GROUP BY type
            `),
            query(`
                SELECT 
                    DATE_TRUNC('month', start_date) as month,
                    COUNT(*) as count,
                    COALESCE(SUM(total_price), 0) as total_value
                FROM contracts 
                WHERE start_date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', start_date)
                ORDER BY month DESC
            `),
            query(`
                SELECT 
                    cu.name,
                    COUNT(c.id) as contract_count,
                    COALESCE(SUM(c.total_price), 0) as total_value
                FROM customers cu
                LEFT JOIN contracts c ON cu.id = c.customer_id
                GROUP BY cu.id, cu.name
                HAVING COUNT(c.id) > 0
                ORDER BY total_value DESC
                LIMIT 10
            `),
            query(`
                SELECT 
                    c.*,
                    cu.name as customer_name,
                    u.code as unit_code,
                    u.name as unit_name
                FROM contracts c
                LEFT JOIN customers cu ON c.customer_id = cu.id
                LEFT JOIN units u ON c.unit_id = u.id
                ORDER BY c.created_at DESC
            `)
        ]);

        res.json({
            contractsByType: contractsByType.rows,
            contractsByMonth: contractsByMonth.rows,
            topCustomers: topCustomers.rows,
            contractDetails: contractDetails.rows
        });

    } catch (error) {
        console.error('Contracts report error:', error);
        res.status(500).json({ error: 'Failed to fetch contracts data' });
    }
});

module.exports = router;