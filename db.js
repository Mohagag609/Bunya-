// This file is the new data layer that connects the frontend to the backend API.
// It replaces the original IndexedDB logic but keeps the same function names
// to minimize changes in the main application logic (app.js).

// This global constant is required by app.js to know which data stores to load.
const OBJECT_STORES = [
    'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
    'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
    'brokers', 'partnerGroups', 'settings', 'keyval'
];

// Use the window.location.origin to construct an absolute URL.
// This is a more robust way to ensure the frontend calls the correct backend,
// especially in environments with complex proxying.
// For local development, use port 8000 for the backend API
// For production (Render), use the same origin
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:8000/api`
    : `${window.location.origin}/api`;

/**
 * A helper function to handle fetch responses, check for errors, and parse JSON.
 * @param {Response} response - The response object from a fetch call.
 * @returns {Promise<any>} - A promise that resolves with the JSON data.
 */
async function handleResponse(response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: 'An unknown server error occurred. The response was not valid JSON.' };
        }
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    // Handle cases where the response might be empty (e.g., for a successful DELETE)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return {}; // Return an empty object for non-json responses
}

/**
 * Fetches all records from a given store (API endpoint).
 * @param {string} storeName - The name of the data store (e.g., 'customers').
 * @returns {Promise<Array<any>>} - A promise that resolves with an array of records.
 */
function getAll(storeName) {
    return fetch(`${API_BASE_URL}/${storeName}`).then(handleResponse);
}

/**
 * Creates or updates an item in the data store using the backend's "upsert" endpoint.
 * @param {string} storeName - The name of the data store.
 * @param {object} item - The item to save. It must have an 'id' or 'key' property.
 * @returns {Promise<any>} - A promise that resolves with the saved item data.
 */
function put(storeName, item) {
    const pkName = (storeName === 'settings' || storeName === 'keyval') ? 'key' : 'id';
    const itemId = item[pkName];

    if (!itemId) {
        return Promise.reject(new Error(`Item must have a primary key ('${pkName}') to be saved.`));
    }

    return fetch(`${API_BASE_URL}/${storeName}/${itemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
    }).then(handleResponse);
}

/**
 * Deletes an item from the data store by its ID.
 * @param {string} storeName - The name of the data store.
 * @param {string} itemId - The ID of the item to delete.
 * @returns {Promise<any>} - A promise that resolves when the deletion is successful.
 */
function deleteItem(storeName, itemId) {
    return fetch(`${API_BASE_URL}/${storeName}/${itemId}`, {
        method: 'DELETE',
    }).then(handleResponse);
}

/**
 * Gets a specific value from the 'keyval' store.
 * @param {string} key - The key of the value to retrieve.
 * @returns {Promise<any>} - A promise that resolves with the value.
 */
async function getKeyVal(key) {
    try {
        const result = await fetch(`${API_BASE_URL}/keyval/${key}`).then(handleResponse);
        // The backend model stores the value inside the 'data' field.
        return result.data.value;
    } catch (error) {
        // If the key is not found, the API returns a 404.
        // The original IndexedDB function would return 'undefined' in this case.
        if (error.message.includes("Not found")) {
            return undefined;
        }
        // Re-throw other errors
        throw error;
    }
}

/**
 * Sets a specific value in the 'keyval' store.
 * @param {string} key - The key of the value to set.
 * @param {any} value - The value to set.
 * @returns {Promise<any>}
 */
function setKeyVal(key, value) {
    // The `put` function expects a flat object with the primary key.
    // The backend API will correctly place the `value` field inside the `data` JSONB column.
    return put('keyval', { key: key, value: value });
}

/**
 * Dummy function to maintain compatibility. The application is no longer using IndexedDB.
 * @returns {Promise<void>}
 */
function openDB() {
    console.log("openDB is deprecated. The application now uses a backend API.");
    return Promise.resolve();
}
