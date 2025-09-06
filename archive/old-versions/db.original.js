// This is a reconstruction of the original db.js file, used only for the
// one-time data export from the browser's IndexedDB.

const DB_NAME = 'estate_pro_db';
const DB_VERSION = 1; // Must match the version the user's data was created with
let db;

// This list MUST match the original list to export all data.
const OBJECT_STORES = [
    'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
    'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
    'brokers', 'partnerGroups', 'settings', 'keyval'
];

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        console.log(`Attempting to open IndexedDB: ${DB_NAME} version ${DB_VERSION}`);
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error: ' + event.target.error);
        };

        // Do not perform upgrades, just open the existing database.
        // The onupgradeneeded event will not fire if the version is the same.
        request.onupgradeneeded = (event) => {
            console.warn('onupgradeneeded event fired unexpectedly during export. This should not happen if the DB exists.');
            // To be safe, we can recreate the schema if needed, but it's not the primary goal.
            const dbInstance = event.target.result;
            OBJECT_STORES.forEach(storeName => {
                if (!dbInstance.objectStoreNames.contains(storeName)) {
                    const keyPath = (storeName === 'settings' || storeName === 'keyval') ? { keyPath: 'key' } : { keyPath: 'id' };
                    dbInstance.createObjectStore(storeName, keyPath);
                    console.log(`Object store created: ${storeName}`);
                }
            });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully for export.');
            resolve(db);
        };
    });
}

function getAll(storeName) {
    return new Promise((resolve, reject) => {
        openDB().then(db => {
            if (!db.objectStoreNames.contains(storeName)) {
                console.warn(`Object store "${storeName}" not found in database. Skipping.`);
                return resolve([]); // Return empty array if store doesn't exist
            }
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error(`Error fetching from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(reject);
    });
}
