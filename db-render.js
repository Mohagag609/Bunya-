/* ===== RENDER PRODUCTION DATABASE CONNECTION ===== */
// استبدل هذا الرابط برابط Render الخاص بك
const API_BASE_URL = 'https://estate-management-backend.onrender.com/api';
let authToken = null;

// Authentication functions
async function login() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      console.log('Login successful');
      return true;
    } else {
      console.error('Login failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

async function getAuthToken() {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
    if (!authToken) {
      const loginSuccess = await login();
      if (!loginSuccess) {
        throw new Error('Failed to authenticate');
      }
    }
  }
  return authToken;
}

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      // Token expired, try to login again
      authToken = null;
      localStorage.removeItem('authToken');
      const loginSuccess = await login();
      if (loginSuccess) {
        // Retry the request
        return apiRequest(endpoint, options);
      } else {
        throw new Error('Authentication failed');
      }
    }
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Database operations that replace IndexedDB functions
const db = {
  // Initialize database connection
  async initialize() {
    try {
      await login();
      console.log('Backend database connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to backend database:', error);
      return false;
    }
  },

  // Get all records from a table
  async getAll(tableName, conditions = {}) {
    try {
      const queryParams = new URLSearchParams(conditions);
      const endpoint = `/data/${tableName}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(endpoint);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
  },

  // Get single record by ID
  async getById(tableName, id) {
    try {
      return await apiRequest(`/data/${tableName}/${id}`);
    } catch (error) {
      console.error(`Error fetching ${tableName} with id ${id}:`, error);
      return null;
    }
  },

  // Insert new record
  async insert(tableName, data) {
    try {
      return await apiRequest(`/data/${tableName}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      throw error;
    }
  },

  // Update record by ID
  async update(tableName, id, data) {
    try {
      return await apiRequest(`/data/${tableName}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Error updating ${tableName} with id ${id}:`, error);
      throw error;
    }
  },

  // Delete record by ID
  async delete(tableName, id) {
    try {
      return await apiRequest(`/data/${tableName}/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(`Error deleting from ${tableName} with id ${id}:`, error);
      throw error;
    }
  },

  // Bulk insert
  async bulkInsert(tableName, data) {
    try {
      return await apiRequest('/data/bulk-insert', {
        method: 'POST',
        body: JSON.stringify({
          tableName,
          data
        })
      });
    } catch (error) {
      console.error(`Error bulk inserting into ${tableName}:`, error);
      throw error;
    }
  },

  // Get dashboard data
  async getDashboardData() {
    try {
      return await apiRequest('/data/dashboard');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return null;
    }
  },

  // Get audit log
  async getAuditLog(page = 1, limit = 50) {
    try {
      return await apiRequest(`/data/audit-log?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
    }
  }
};

// Migration functions
const migration = {
  // Import data from JSON
  async importData(data) {
    try {
      return await apiRequest('/migration/import', {
        method: 'POST',
        body: JSON.stringify({ data })
      });
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  // Export data to JSON
  async exportData() {
    try {
      return await apiRequest('/migration/export');
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Get migration status
  async getStatus() {
    try {
      return await apiRequest('/migration/status');
    } catch (error) {
      console.error('Error getting migration status:', error);
      return null;
    }
  },

  // Clear all data
  async clearData() {
    try {
      return await apiRequest('/migration/clear', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
};

// State management functions that work with backend
let state = {};

async function loadStateFromBackend() {
  try {
    console.log('Loading state from backend...');
    
    // Load all data from backend
    const [
      customers,
      units,
      partners,
      unitPartners,
      contracts,
      installments,
      partnerDebts,
      safes,
      transfers,
      auditLog,
      vouchers,
      brokerDues,
      brokers,
      partnerGroups,
      settings,
      keyval
    ] = await Promise.all([
      db.getAll('customers'),
      db.getAll('units'),
      db.getAll('partners'),
      db.getAll('unit-partners'),
      db.getAll('contracts'),
      db.getAll('installments'),
      db.getAll('partner-debts'),
      db.getAll('safes'),
      db.getAll('transfers'),
      db.getAll('audit-log'),
      db.getAll('vouchers'),
      db.getAll('broker-dues'),
      db.getAll('brokers'),
      db.getAll('partner-groups'),
      db.getAll('settings'),
      db.getAll('keyval')
    ]);

    // Convert settings from array to object
    const settingsObj = settings.find(s => s.key === 'appSettings')?.value || { theme: 'dark', font: 16, pass: null };
    
    // Convert keyval from array to object
    const keyvalObj = {};
    keyval.forEach(kv => {
      keyvalObj[kv.key] = kv.value;
    });

    state = {
      customers,
      units,
      partners,
      unitPartners,
      contracts,
      installments,
      partnerDebts,
      safes,
      transfers,
      auditLog,
      vouchers,
      brokerDues,
      brokers,
      partnerGroups,
      settings: settingsObj,
      keyval: keyvalObj,
      locked: false
    };

    console.log('State loaded from backend successfully');
    return state;
  } catch (error) {
    console.error('Failed to load state from backend:', error);
    // Return empty state if backend fails
    return {
      customers: [],
      units: [],
      partners: [],
      unitPartners: [],
      contracts: [],
      installments: [],
      partnerDebts: [],
      safes: [{ id: 'S-default', name: 'الخزنة الرئيسية', balance: 0 }],
      transfers: [],
      auditLog: [],
      vouchers: [],
      brokerDues: [],
      brokers: [],
      partnerGroups: [],
      settings: { theme: 'dark', font: 16, pass: null },
      keyval: {},
      locked: false
    };
  }
}

async function persistToBackend() {
  try {
    console.log('Persisting state to backend...');
    
    // Update all tables in backend
    const tables = [
      'customers', 'units', 'partners', 'unit-partners', 'contracts',
      'installments', 'partner-debts', 'safes', 'transfers', 'audit-log',
      'vouchers', 'broker-dues', 'brokers', 'partner-groups'
    ];

    for (const table of tables) {
      const tableData = state[table] || [];
      if (tableData.length > 0) {
        await db.bulkInsert(table, tableData);
      }
    }

    // Update settings
    if (state.settings) {
      await db.update('settings', 'appSettings', {
        key: 'appSettings',
        value: JSON.stringify(state.settings)
      });
    }

    // Update keyval
    if (state.keyval) {
      for (const [key, value] of Object.entries(state.keyval)) {
        await db.update('keyval', key, {
          key,
          value: JSON.stringify(value)
        });
      }
    }

    console.log('State persisted to backend successfully');
  } catch (error) {
    console.error('Failed to persist state to backend:', error);
    throw error;
  }
}

// Export functions for use in app.js
window.db = db;
window.migration = migration;
window.loadStateFromBackend = loadStateFromBackend;
window.persistToBackend = persistToBackend;