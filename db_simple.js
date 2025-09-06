// Simplified Database Layer using LocalStorage
// This version works without a backend server

// OBJECT_STORES is defined in index.html
const OBJECT_STORES = window.OBJECT_STORES;

// Simple LocalStorage-based database functions
class SimpleDB {
    constructor() {
        this.prefix = 'real_estate_';
        this.initializeStores();
    }

    initializeStores() {
        OBJECT_STORES.forEach(storeName => {
            if (storeName !== 'keyval' && storeName !== 'settings') {
                const key = this.prefix + storeName;
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, JSON.stringify([]));
                }
            }
        });
        
        // Initialize settings
        const settingsKey = this.prefix + 'settings';
        if (!localStorage.getItem(settingsKey)) {
            localStorage.setItem(settingsKey, JSON.stringify({ theme: 'dark', font: 16, pass: null, key: 'main' }));
        }
    }

    async getAll(storeName) {
        try {
            const key = this.prefix + storeName;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error getting all from ${storeName}:`, error);
            return [];
        }
    }

    async get(storeName, id) {
        try {
            const all = await this.getAll(storeName);
            return all.find(item => item.id === id) || null;
        } catch (error) {
            console.error(`Error getting ${id} from ${storeName}:`, error);
            return null;
        }
    }

    async put(storeName, item) {
        try {
            const all = await this.getAll(storeName);
            const index = all.findIndex(existing => existing.id === item.id);
            
            if (index >= 0) {
                all[index] = item;
            } else {
                all.push(item);
            }
            
            const key = this.prefix + storeName;
            localStorage.setItem(key, JSON.stringify(all));
            return item;
        } catch (error) {
            console.error(`Error putting item in ${storeName}:`, error);
            throw error;
        }
    }

    async delete(storeName, id) {
        try {
            const all = await this.getAll(storeName);
            const filtered = all.filter(item => item.id !== id);
            const key = this.prefix + storeName;
            localStorage.setItem(key, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error(`Error deleting ${id} from ${storeName}:`, error);
            throw error;
        }
    }

    async clear(storeName) {
        try {
            const key = this.prefix + storeName;
            localStorage.setItem(key, JSON.stringify([]));
            return true;
        } catch (error) {
            console.error(`Error clearing ${storeName}:`, error);
            throw error;
        }
    }
}

// Create global instance
const db = new SimpleDB();

// Export functions for compatibility
window.getAll = (storeName) => db.getAll(storeName);
window.get = (storeName, id) => db.get(storeName, id);
window.put = (storeName, item) => db.put(storeName, item);
window.delete = (storeName, id) => db.delete(storeName, id);
window.clear = (storeName) => db.clear(storeName);

// Initialize database
console.log('SimpleDB initialized with LocalStorage');