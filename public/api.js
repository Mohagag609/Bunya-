// API Client for Estate Management System
class EstateAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.setToken(data.token);
        return data;
    }

    async logout() {
        this.setToken(null);
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    // Customers
    async getCustomers(page = 1, limit = 50, search = '') {
        const params = new URLSearchParams({ page, limit, search });
        return await this.request(`/customers?${params}`);
    }

    async getCustomer(id) {
        return await this.request(`/customers/${id}`);
    }

    async createCustomer(customerData) {
        return await this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }

    async updateCustomer(id, customerData) {
        return await this.request(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    }

    async deleteCustomer(id) {
        return await this.request(`/customers/${id}`, {
            method: 'DELETE'
        });
    }

    async importCustomers(customers) {
        return await this.request('/customers/import', {
            method: 'POST',
            body: JSON.stringify({ customers })
        });
    }

    // Units
    async getUnits(page = 1, limit = 50, search = '', status = '', unitType = '') {
        const params = new URLSearchParams({ page, limit, search, status, unitType });
        return await this.request(`/units?${params}`);
    }

    async getUnit(id) {
        return await this.request(`/units/${id}`);
    }

    async createUnit(unitData) {
        return await this.request('/units', {
            method: 'POST',
            body: JSON.stringify(unitData)
        });
    }

    async updateUnit(id, unitData) {
        return await this.request(`/units/${id}`, {
            method: 'PUT',
            body: JSON.stringify(unitData)
        });
    }

    async deleteUnit(id) {
        return await this.request(`/units/${id}`, {
            method: 'DELETE'
        });
    }

    async getUnitPartners(unitId) {
        return await this.request(`/units/${unitId}/partners`);
    }

    async addUnitPartner(unitId, partnerId, percent) {
        return await this.request(`/units/${unitId}/partners`, {
            method: 'POST',
            body: JSON.stringify({ partnerId, percent })
        });
    }

    async removeUnitPartner(unitId, partnerId) {
        return await this.request(`/units/${unitId}/partners/${partnerId}`, {
            method: 'DELETE'
        });
    }

    // Partners
    async getPartners(page = 1, limit = 50, search = '') {
        const params = new URLSearchParams({ page, limit, search });
        return await this.request(`/partners?${params}`);
    }

    async getPartner(id) {
        return await this.request(`/partners/${id}`);
    }

    async createPartner(partnerData) {
        return await this.request('/partners', {
            method: 'POST',
            body: JSON.stringify(partnerData)
        });
    }

    async updatePartner(id, partnerData) {
        return await this.request(`/partners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(partnerData)
        });
    }

    async deletePartner(id) {
        return await this.request(`/partners/${id}`, {
            method: 'DELETE'
        });
    }

    // Contracts
    async getContracts(page = 1, limit = 50, search = '') {
        const params = new URLSearchParams({ page, limit, search });
        return await this.request(`/contracts?${params}`);
    }

    async getContract(id) {
        return await this.request(`/contracts/${id}`);
    }

    async createContract(contractData) {
        return await this.request('/contracts', {
            method: 'POST',
            body: JSON.stringify(contractData)
        });
    }

    async updateContract(id, contractData) {
        return await this.request(`/contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(contractData)
        });
    }

    async deleteContract(id) {
        return await this.request(`/contracts/${id}`, {
            method: 'DELETE'
        });
    }

    // Safes
    async getSafes() {
        return await this.request('/safes');
    }

    async getSafe(id) {
        return await this.request(`/safes/${id}`);
    }

    async createSafe(safeData) {
        return await this.request('/safes', {
            method: 'POST',
            body: JSON.stringify(safeData)
        });
    }

    async updateSafe(id, safeData) {
        return await this.request(`/safes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(safeData)
        });
    }

    async deleteSafe(id) {
        return await this.request(`/safes/${id}`, {
            method: 'DELETE'
        });
    }

    // Vouchers
    async getVouchers(page = 1, limit = 50, type = '', dateFrom = '', dateTo = '') {
        const params = new URLSearchParams({ page, limit, type, dateFrom, dateTo });
        return await this.request(`/vouchers?${params}`);
    }

    async getVoucher(id) {
        return await this.request(`/vouchers/${id}`);
    }

    async createVoucher(voucherData) {
        return await this.request('/vouchers', {
            method: 'POST',
            body: JSON.stringify(voucherData)
        });
    }

    async updateVoucher(id, voucherData) {
        return await this.request(`/vouchers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(voucherData)
        });
    }

    async deleteVoucher(id) {
        return await this.request(`/vouchers/${id}`, {
            method: 'DELETE'
        });
    }

    // Reports
    async getDashboard() {
        return await this.request('/reports/dashboard');
    }

    async getFinancialReport() {
        return await this.request('/reports/financial');
    }

    async getUnitsReport() {
        return await this.request('/reports/units');
    }

    async getContractsReport() {
        return await this.request('/reports/contracts');
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ج.م';
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG');
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'none';
    }

    showLoading() {
        const loadingDiv = document.getElementById('loading');
        loadingDiv.style.display = 'block';
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loading');
        loadingDiv.style.display = 'none';
    }
}

// Create global API instance
window.api = new EstateAPI();