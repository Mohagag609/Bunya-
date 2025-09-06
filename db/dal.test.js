const fs = require('fs');
const path = require('path');
const dal = require('./dal');

// Test data
const testData = {
    customers: [{ id: 'C-1', name: 'Test Customer', phone: '12345' }],
    units: [{ id: 'U-1', code: 'T1-F1-U1', name: 'Test Unit 1', totalPrice: 100000 }],
    partners: [{ id: 'P-1', name: 'Test Partner', phone: '54321' }],
    brokers: [{ id: 'B-1', name: 'Test Broker', phone: '98765' }],
    safes: [{ id: 'S-1', name: 'Test Safe', balance: 50000 }],
};

describe('Data Access Layer', () => {
    let db;

    beforeAll(() => {
        // Use an in-memory database for tests to avoid side-effects
        db = dal.init(':memory:');
    });

    test('should initialize and apply the schema', () => {
        const result = dal.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['customers']);
        expect(result).toBeDefined();
        expect(result.name).toBe('customers');
    });

    test('should run INSERT and GET data', () => {
        const insertSql = `INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)`;
        const insertResult = dal.run(insertSql, ['C-1', 'John Doe', '123']);
        expect(insertResult.changes).toBe(1);

        const selectResult = dal.get('SELECT * FROM customers WHERE id = ?', ['C-1']);
        expect(selectResult).toEqual({
            id: 'C-1',
            name: 'John Doe',
            phone: '123',
            nationalId: null,
            address: null,
            status: null,
            notes: null,
        });
    });

    test('should get ALL data', () => {
        dal.run(`INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)`, ['C-2', 'Jane Doe', '456']);
        const results = dal.all('SELECT * FROM customers ORDER BY name');
        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Jane Doe');
        expect(results[1].name).toBe('John Doe');
    });

    describe('Transactions', () => {
        beforeEach(() => {
            // Clear tables before each transactional test
            db.prepare('DELETE FROM contracts').run();
            db.prepare('DELETE FROM installments').run();
            db.prepare('DELETE FROM vouchers').run();
            db.prepare('DELETE FROM brokerDues').run();
            db.prepare('DELETE FROM units').run();
            db.prepare('DELETE FROM customers').run();
            db.prepare('DELETE FROM brokers').run();
            db.prepare('DELETE FROM safes').run();
        });

        test('createContractTransaction should insert related records', () => {
            // Setup dependencies
            dal.run(`INSERT INTO units (id, code, status) VALUES (?, ?, ?)`, ['U-1', 'T-U1', 'متاحة']);
            dal.run(`INSERT INTO customers (id, name) VALUES (?, ?)`, ['C-1', 'Cust1']);
            dal.run(`INSERT INTO brokers (id, name) VALUES (?, ?)`, ['B-1', 'Broker1']);
            dal.run(`INSERT INTO safes (id, name, balance) VALUES (?, ?, ?)`, ['S-1', 'Safe1', 1000]);

            const contractData = {
                contract: { id: 'CT-1', code: 'CTR-001', unitId: 'U-1', customerId: 'C-1', totalPrice: 100000, downPayment: 10000, brokerId: 'B-1', commissionSafeId: 'S-1', start: '2023-01-01' },
                installments: [{ id: 'I-1', unitId: 'U-1', type: 'شهري', amount: 5000, originalAmount: 5000, dueDate: '2023-02-01', status: 'غير مدفوع' }],
                voucher: { id: 'V-1', type: 'receipt', date: '2023-01-01', amount: 10000, safeId: 'S-1', description: 'Down payment', payer: 'Cust1', linked_ref: 'CT-1' },
                brokerDue: { id: 'BD-1', contractId: 'CT-1', brokerId: 'B-1', amount: 2500, dueDate: '2023-01-01', status: 'due' }
            };

            dal.createContractTransaction(contractData);

            // Verify insertions
            expect(dal.get('SELECT * FROM contracts WHERE id = ?', ['CT-1'])).toBeDefined();
            expect(dal.get('SELECT * FROM installments WHERE id = ?', ['I-1'])).toBeDefined();
            expect(dal.get('SELECT * FROM vouchers WHERE id = ?', ['V-1'])).toBeDefined();
            expect(dal.get('SELECT * FROM brokerDues WHERE id = ?', ['BD-1'])).toBeDefined();

            // Verify side-effects
            expect(dal.get('SELECT status FROM units WHERE id = ?', ['U-1']).status).toBe('مباعة');
            expect(dal.get('SELECT balance FROM safes WHERE id = ?', ['S-1']).balance).toBe(11000); // 1000 initial + 10000 down payment
        });
    });
});
