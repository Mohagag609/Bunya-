// Database Layer for Real Estate Manager with PostgreSQL API
// This file connects the frontend to the Flask backend API

// OBJECT_STORES is defined in index.html
const OBJECT_STORES = window.OBJECT_STORES;

// API Base URL
const API_BASE = window.location.origin + '/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Database functions that match the original IndexedDB interface
async function getAll(storeName) {
    try {
        return await apiCall(`/${storeName}`);
    } catch (error) {
        console.error(`Failed to get all from ${storeName}:`, error);
        return [];
    }
}

async function get(storeName, id) {
    try {
        return await apiCall(`/${storeName}/${id}`);
    } catch (error) {
        console.error(`Failed to get ${id} from ${storeName}:`, error);
        return null;
    }
}

async function put(storeName, item) {
    try {
        const method = item.id && await get(storeName, item.id) ? 'PUT' : 'POST';
        return await apiCall(`/${storeName}`, method, item);
    } catch (error) {
        console.error(`Failed to put item in ${storeName}:`, error);
        throw error;
    }
}

async function delete(storeName, id) {
    try {
        await apiCall(`/${storeName}/${id}`, 'DELETE');
        return true;
    } catch (error) {
        console.error(`Failed to delete ${id} from ${storeName}:`, error);
        throw error;
    }
}

async function clear(storeName) {
    try {
        await apiCall(`/${storeName}`, 'DELETE');
        return true;
    } catch (error) {
        console.error(`Failed to clear ${storeName}:`, error);
        throw error;
    }
}

// Export functions globally for compatibility
window.getAll = getAll;
window.get = get;
window.put = put;
window.delete = delete;
window.clear = clear;

console.log('Database layer initialized with PostgreSQL API');