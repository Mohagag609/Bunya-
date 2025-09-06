const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db;
const CODE_SCHEMA_VERSION = 1;

function init(dbPath = path.join(__dirname, 'app.db')) {
    db = new Database(dbPath, { verbose: console.log }); // verbose logging for tests
    applySchema();
    return db;
}

/**
 * Applies the database schema if the DB is new or needs an upgrade.
 */
function applySchema() {
    // Get current schema version from the DB.
    let dbVersion = 0;
    try {
        const row = db.prepare("SELECT version FROM schema_version").get();
        if (row) {
            dbVersion = row.version;
        }
    } catch (e) {
        // schema_version table doesn't exist, so it's a fresh DB.
    }

    if (dbVersion < CODE_SCHEMA_VERSION) {
        console.log(`Database schema is old (v${dbVersion}), upgrading to v${CODE_SCHEMA_VERSION}...`);
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        db.exec(schema);

        // Set the new version
        const stmt = db.prepare("INSERT OR REPLACE INTO schema_version (version) VALUES (?)");
        stmt.run(CODE_SCHEMA_VERSION);
        console.log("Database schema applied successfully.");
    } else if (dbVersion > CODE_SCHEMA_VERSION) {
        console.error(`FATAL: Database schema version (v${dbVersion}) is newer than the application's (v${CODE_SCHEMA_VERSION}). Please upgrade the application.`);
        // In a real app, you'd want to handle this more gracefully.
        process.exit(1);
    } else {
        console.log("Database schema is up to date.");
        // Make sure foreign keys are enabled for every connection
        db.pragma('foreign_keys = ON');
    }
}

// Apply the schema on startup.
applySchema();

/**
 * A generic function to get all records from a table.
 * @param {string} tableName The name of the table.
 * @returns {Array} An array of records.
 */
function getAll(tableName) {
    try {
        const stmt = db.prepare(`SELECT * FROM ${tableName}`);
        return stmt.all();
    } catch (error) {
        console.error(`Error getting all from ${tableName}:`, error);
        throw error;
    }
}

/**
 * A generic function to get a single record by its ID.
 * @param {string} tableName The name of the table.
 * @param {string} id The ID of the record.
 * @returns {object | null} The record or null if not found.
 */
function getById(tableName, id) {
    try {
        const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
        return stmt.get(id);
    } catch (error) {
        console.error(`Error getting by id from ${tableName}:`, error);
        throw error;
    }
}

/**
 * A generic function to run any single query that doesn't return data (INSERT, UPDATE, DELETE).
 * @param {string} sql The SQL statement to run.
 * @param {Array} params The parameters for the statement.
 * @returns {Database.RunResult}
 */
function run(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.run(...params);
    } catch (error) {
        console.error('Error running SQL:', sql, params, error);
        throw error;
    }
}

/**
 * A generic function to run a SELECT query that returns one row.
 * @param {string} sql The SQL statement to run.
 * @param {Array} params The parameters for the statement.
 * @returns {object | null}
 */
function get(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.get(...params);
    } catch (error) {
        console.error('Error getting with SQL:', sql, params, error);
        throw error;
    }
}

/**
 * A generic function to run a SELECT query that returns multiple rows.
 * @param {string} sql The SQL statement to run.
 * @param {Array} params The parameters for the statement.
 * @returns {Array}
 */
function all(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    } catch (error) {
        console.error('Error getting all with SQL:', sql, params, error);
        throw error;
    }
}

/**
 * Executes a function within a database transaction.
 * @param {Function} fn The function to execute. It will receive the db instance as an argument.
 */
function transaction(fn) {
    const runInTransaction = db.transaction(fn);
    try {
        runInTransaction();
    } catch (error) {
        console.error("Transaction failed:", error);
        throw error; // Re-throw to be handled by the caller
    }
}

function performMigration(data) {
    const startTime = Date.now();
    const report = {
        tables: {},
        warnings: [],
        durationMs: 0
    };

    const migrationTx = db.transaction(() => {
        const tableOrder = [
            'customers', 'partners', 'brokers', 'safes', 'partnerGroups', 'units', 'settings', 'keyval'
        ];

        // Clear existing data
        console.log("Clearing existing data...");
        [...tableOrder, 'partnerGroupMembers', 'unitPartners', 'contracts', 'installments', 'brokerDues', 'partnerDebts', 'vouchers', 'transfers', 'auditLog'].reverse().forEach(table => {
            db.prepare(`DELETE FROM ${table}`).run();
        });


        console.log("Inserting data...");
        // Insert data with dependencies handled
        tableOrder.forEach(table => {
            const items = data[table] || [];
            if (items.length === 0) return;

            const keys = Object.keys(items[0]);
            const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
            const stmt = db.prepare(sql);

            items.forEach(item => {
                const values = keys.map(k => item[k]);
                stmt.run(values);
            });
            report.tables[table] = { source: items.length, inserted: items.length };
        });

        // Handle special cases
        const brokersMap = new Map(data.brokers.map(b => [b.name, b.id]));

        if (data.partnerGroups) {
            const stmt = db.prepare('INSERT INTO partnerGroupMembers (id, groupId, partnerId, percent) VALUES (?, ?, ?, ?)');
            let count = 0;
            data.partnerGroups.forEach(g => {
                if (g.partners && Array.isArray(g.partners)) {
                    g.partners.forEach(p => {
                        stmt.run(p.id || `PGM-${g.id}-${p.partnerId}`, g.id, p.partnerId, p.percent);
                        count++;
                    });
                }
            });
            report.tables.partnerGroupMembers = { source: count, inserted: count };
        }

        if (data.unitPartners) {
            const stmt = db.prepare('INSERT INTO unitPartners (id, unitId, partnerId, percent) VALUES (?, ?, ?, ?)');
            data.unitPartners.forEach(up => stmt.run(up.id, up.unitId, up.partnerId, up.percent));
            report.tables.unitPartners = { source: data.unitPartners.length, inserted: data.unitPartners.length };
        }

        if (data.contracts) {
            const stmt = db.prepare(`INSERT INTO contracts (id, code, unitId, customerId, totalPrice, downPayment, discountAmount, maintenanceDeposit, brokerId, brokerPercent, brokerAmount, commissionSafeId, type, count, extraAnnual, annualPaymentValue, start) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            data.contracts.forEach(c => {
                const brokerId = c.brokerName ? brokersMap.get(c.brokerName) : null;
                if (c.brokerName && !brokerId) {
                    report.warnings.push(`Contract ${c.id} has broker name "${c.brokerName}" but no matching broker was found.`);
                }
                stmt.run(c.id, c.code, c.unitId, c.customerId, c.totalPrice, c.downPayment, c.discountAmount, c.maintenanceDeposit, brokerId, c.brokerPercent, c.brokerAmount, c.commissionSafeId, c.type, c.count, c.extraAnnual, c.annualPaymentValue, c.start);
            });
            report.tables.contracts = { source: data.contracts.length, inserted: data.contracts.length };
        }

        // ... and so on for all other tables
        const remainingTables = ['installments', 'brokerDues', 'partnerDebts', 'vouchers', 'transfers', 'auditLog'];
        remainingTables.forEach(table => {
            const items = data[table] || [];
            if (items.length === 0) return;
            const keys = Object.keys(items[0]).filter(k => k !== 'details'); // handle json details
             if(table === 'auditLog') {
                 keys.push('details');
             }
            const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
            const stmt = db.prepare(sql);
            items.forEach(item => {
                const values = keys.map(k => {
                    if (k === 'details' && typeof item[k] !== 'string') {
                        return JSON.stringify(item[k]);
                    }
                    return item[k];
                });
                stmt.run(values);
            });
            report.tables[table] = { source: items.length, inserted: items.length };
        });
    });

    migrationTx();

    report.durationMs = Date.now() - startTime;
    return report;
}


const createContractTransaction = db.transaction((data) => {
    const { contract, installments, voucher, brokerDue } = data;

    // 1. Insert the contract
    const contractSql = `INSERT INTO contracts (id, code, unitId, customerId, totalPrice, downPayment, discountAmount, maintenanceDeposit, brokerId, brokerPercent, brokerAmount, commissionSafeId, type, count, extraAnnual, annualPaymentValue, start) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.prepare(contractSql).run(contract.id, contract.code, contract.unitId, contract.customerId, contract.totalPrice, contract.downPayment, contract.discountAmount, contract.maintenanceDeposit, contract.brokerId, contract.brokerPercent, contract.brokerAmount, contract.commissionSafeId, contract.type, contract.count, contract.extraAnnual, contract.annualPaymentValue, contract.start);

    // 2. Update unit status
    db.prepare(`UPDATE units SET status = 'مباعة' WHERE id = ?`).run(contract.unitId);

    // 3. Insert down payment voucher if it exists
    if (voucher) {
        const voucherSql = `INSERT INTO vouchers (id, type, date, amount, safeId, description, payer, linked_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.prepare(voucherSql).run(voucher.id, voucher.type, voucher.date, voucher.amount, voucher.safeId, voucher.description, voucher.payer, voucher.linked_ref);
        // Update safe balance
        db.prepare(`UPDATE safes SET balance = balance + ? WHERE id = ?`).run(voucher.amount, voucher.safeId);
    }

    // 4. Insert broker due if it exists
    if (brokerDue) {
        const brokerDueSql = `INSERT INTO brokerDues (id, contractId, brokerId, amount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?)`;
        db.prepare(brokerDueSql).run(brokerDue.id, brokerDue.contractId, brokerDue.brokerId, brokerDue.amount, brokerDue.dueDate, brokerDue.status);
    }

    // 5. Insert all installments
    if (installments && installments.length > 0) {
        const instStmt = db.prepare(`INSERT INTO installments (id, unitId, type, amount, originalAmount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        for (const inst of installments) {
            instStmt.run(inst.id, inst.unitId, inst.type, inst.amount, inst.originalAmount, inst.dueDate, inst.status);
        }
    }

    return { contractId: contract.id };
});

const deleteContractTransaction = db.transaction((contractId, keepCommission) => {
    // This is complex due to cascading effects.
    // We need to reverse all financial transactions.

    const contract = get('SELECT * FROM contracts WHERE id = ?', [contractId]);
    if (!contract) throw new Error("Contract not found");

    const unitId = contract.unitId;
    const installments = all('SELECT id FROM installments WHERE unitId = ?', [unitId]);
    const installmentIds = installments.map(i => i.id);

    // Find related vouchers (down payment and installments)
    const relatedVouchers = all(`SELECT * FROM vouchers WHERE linked_ref = ? OR linked_ref IN (${installmentIds.map(()=>'?').join(',')})`, [contractId, ...installmentIds]);

    // Reverse voucher effects on safes
    const updateSafe = db.prepare('UPDATE safes SET balance = balance - ? WHERE id = ?');
    for (const v of relatedVouchers) {
        if (v.type === 'receipt') {
            updateSafe.run(v.amount, v.safeId);
        }
    }

    // Handle commission
    const brokerDue = get('SELECT * FROM brokerDues WHERE contractId = ?', [contractId]);
    if (brokerDue && !keepCommission) {
        const commissionVoucher = get('SELECT * FROM vouchers WHERE linked_ref = ?', [brokerDue.id]);
        if (commissionVoucher) {
            // It was a payment, so add it back to the safe
            db.prepare('UPDATE safes SET balance = balance + ? WHERE id = ?').run(commissionVoucher.amount, commissionVoucher.safeId);
            db.prepare('DELETE FROM vouchers WHERE id = ?').run(commissionVoucher.id);
        }
        db.prepare('DELETE FROM brokerDues WHERE id = ?').run(brokerDue.id);
    }

    // Delete all the records
    db.prepare(`DELETE FROM vouchers WHERE id IN (${relatedVouchers.map(v=>`'${v.id}'`).join(',')})`).run();
    db.prepare('DELETE FROM installments WHERE unitId = ?').run(unitId);
    db.prepare('DELETE FROM contracts WHERE id = ?').run(contractId);
    db.prepare(`UPDATE units SET status = 'متاحة' WHERE id = ?`).run(unitId);
});

const payInstallmentTransaction = db.transaction((data) => {
    const { unitId, amount, date, safeId, installmentId } = data;

    // 1. Create a receipt voucher for the payment
    const { payer, description } = data; // These should be passed from the client
    const voucher = {
        id: `V-${Date.now()}`, // A simple UID for now
        type: 'receipt',
        date,
        amount,
        safeId,
        description,
        payer,
        linked_ref: installmentId || unitId
    };
    db.prepare(`INSERT INTO vouchers (id, type, date, amount, safeId, description, payer, linked_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(voucher.id, voucher.type, voucher.date, voucher.amount, voucher.safeId, voucher.description, voucher.payer, voucher.linked_ref);

    // 2. Add money to the safe
    db.prepare(`UPDATE safes SET balance = balance + ? WHERE id = ?`).run(amount, safeId);

    // 3. Apply payment to installments
    let remainingAmountToProcess = amount;
    const installmentsToPay = db.prepare(`SELECT * FROM installments WHERE unitId = ? AND status != 'مدفوع' ORDER BY dueDate ASC`).all(unitId);

    const updateInstStmt = db.prepare(`UPDATE installments SET amount = ?, status = ?, paymentDate = ? WHERE id = ?`);

    for (const inst of installmentsToPay) {
        if (remainingAmountToProcess <= 0) break;
        const amountToPayOnThisInstallment = Math.min(remainingAmountToProcess, inst.amount);

        const newAmount = inst.amount - amountToPayOnThisInstallment;
        remainingAmountToProcess -= amountToPayOnThisInstallment;

        let newStatus = inst.status;
        let paymentDate = inst.paymentDate;
        if (newAmount <= 0.005) {
            newStatus = 'مدفوع';
            paymentDate = date;
        } else {
            newStatus = 'مدفوع جزئياً';
        }
        updateInstStmt.run(newAmount, newStatus, paymentDate, inst.id);
    }

    return { success: true, overpayment: remainingAmountToProcess };
});

// Initialize with default production DB for the application
init();

module.exports = {
    db,
    init,
    applySchema,
    getAll,
    getById,
    run,
    get,
    all,
    transaction,
    performMigration,
    createContractTransaction,
    deleteContractTransaction,
    payInstallmentTransaction,
};
