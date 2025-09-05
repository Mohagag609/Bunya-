// Estate Manager - Original Complete Version
// Main application file with all original features and functionality

// Global configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? `http://${window.location.hostname}:8000/api`
        : 'https://estate-manager-backend-vwop.onrender.com/api',
    OBJECT_STORES: [
        'customers', 'units', 'partners', 'unitPartners', 'contracts', 
        'installments', 'partnerDebts', 'safes', 'transfers', 'auditLog', 
        'vouchers', 'brokerDues', 'brokers', 'partnerGroups', 'settings', 'keyval'
    ],
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    CACHE_KEY: 'estate_manager_cache'
};

// Global state
let appState = {
    customers: [],
    units: [],
    partners: [],
    unitPartners: [],
    contracts: [],
    installments: [],
    partnerDebts: [],
    safes: [],
    transfers: [],
    auditLog: [],
    vouchers: [],
    brokerDues: [],
    brokers: [],
    partnerGroups: [],
    settings: { theme: 'dark', font: 16, pass: '123' },
    keyval: {},
    locked: false,
    currentView: 'dash',
    currentParam: null
};

// API Service
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}/${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: `Server error: ${response.status}` };
                }
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return {};
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Initialize API service
const api = new ApiService();

// Cache management
function getCachedData() {
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < CONFIG.CACHE_DURATION) {
                return data.stores;
            }
        }
    } catch (error) {
        console.error('Error reading cache:', error);
    }
    return null;
}

function setCachedData(stores) {
    try {
        const data = {
            timestamp: Date.now(),
            stores: stores
        };
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

// Load data from API with caching
async function loadData() {
    console.log('Loading data...');
    
    // Try cache first for instant loading
    const cachedData = getCachedData();
    if (cachedData) {
        console.log('Using cached data for instant loading');
        Object.assign(appState, cachedData);
        return;
    }
    
    console.log('Loading fresh data from API...');
    const stores = {};
    
    for (const store of CONFIG.OBJECT_STORES) {
        try {
            console.log(`Loading ${store}...`);
            const data = await api.get(store);
            stores[store] = Array.isArray(data) ? data : [];
            appState[store] = stores[store];
            console.log(`Loaded ${data.length || 0} items from ${store}`);
        } catch (error) {
            console.error(`Failed to load data for ${store}:`, error);
            stores[store] = [];
            appState[store] = [];
        }
    }
    
    // Cache the data for next time
    setCachedData(stores);
    console.log('Data loading completed and cached');
}

// Create initial safe if none exists
async function createInitialSafe() {
    try {
        if (appState.safes.length === 0) {
            console.log('Creating initial safe...');
            const defaultSafe = {
                id: 'S_main',
                name: 'الخزنة الرئيسية',
                balance: 0
            };
            await api.put('safes/S_main', defaultSafe);
            appState.safes = [defaultSafe];
            console.log('Initial safe created');
        }
    } catch (error) {
        console.error('Failed to create initial safe:', error);
    }
}

// UI Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 6px;
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showLoading(message = 'جاري التحميل...') {
    const loading = document.createElement('div');
    loading.id = 'loading-overlay';
    loading.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        ">
            <div style="
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <div style="margin-bottom: 10px;">⏳</div>
                <div>${message}</div>
            </div>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.remove();
    }
}

// Render functions
function renderHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    header.innerHTML = `
        <div class="brand">
            <div class="logo">🏛️</div>
            <h1>مدير الاستثمار العقاري — النسخة المحدثة</h1>
        </div>
        <div class="tools">
            <select class="select" id="themeSel">
                <option value="dark" ${appState.settings.theme === 'dark' ? 'selected' : ''}>داكن</option>
                <option value="light" ${appState.settings.theme === 'light' ? 'selected' : ''}>فاتح</option>
            </select>
            <select class="select" id="fontSel">
                <option value="14" ${appState.settings.font === 14 ? 'selected' : ''}>خط 14</option>
                <option value="16" ${appState.settings.font === 16 ? 'selected' : ''}>خط 16</option>
                <option value="18" ${appState.settings.font === 18 ? 'selected' : ''}>خط 18</option>
            </select>
            <button class="btn btn-secondary" id="lockBtn">
                ${appState.locked ? '🔓 فتح' : '🔒 قفل'}
            </button>
        </div>
    `;
}

function renderSidebar() {
    const sidebar = document.querySelector('#tabs');
    if (!sidebar) return;

    const navigationItems = [
        { id: 'dash', label: 'لوحة التحكم', icon: '📊' },
        { id: 'customers', label: 'العملاء', icon: '👥' },
        { id: 'units', label: 'الوحدات', icon: '🏠' },
        { id: 'contracts', label: 'العقود', icon: '📋' },
        { id: 'installments', label: 'الأقساط', icon: '💳' },
        { id: 'partners', label: 'الشركاء', icon: '🤝' },
        { id: 'partnerGroups', label: 'مجموعات الشركاء', icon: '👥' },
        { id: 'partnerDebts', label: 'ديون الشركاء', icon: '💸' },
        { id: 'safes', label: 'الخزائن', icon: '💰' },
        { id: 'transfers', label: 'التحويلات', icon: '🔄' },
        { id: 'vouchers', label: 'السندات', icon: '🧾' },
        { id: 'brokers', label: 'الوسطاء', icon: '🤝' },
        { id: 'brokerDues', label: 'عمولات الوسطاء', icon: '💼' },
        { id: 'auditLog', label: 'سجل المراجعة', icon: '📝' },
        { id: 'reports', label: 'التقارير', icon: '📈' },
        { id: 'settings', label: 'الإعدادات', icon: '⚙️' }
    ];

    sidebar.innerHTML = `
        <nav class="sidebar-nav">
            ${navigationItems.map(item => `
                <button class="nav-item" data-view="${item.id}" id="nav-${item.id}">
                    <span class="nav-icon">${item.icon}</span>
                    <span class="nav-label">${item.label}</span>
                </button>
            `).join('')}
        </nav>
    `;
}

function renderMainContent() {
    const view = document.querySelector('#view');
    if (!view) return;

    // Don't show loading state if we're not on dashboard
    if (appState.currentView !== 'dash') {
        // Render the requested view directly
        switch (appState.currentView) {
            case 'customers':
                renderCustomers(view);
                break;
            case 'units':
                renderUnits(view);
                break;
            case 'contracts':
                renderContracts(view);
                break;
            case 'installments':
                renderInstallments(view);
                break;
            case 'partners':
                renderPartners(view);
                break;
            case 'partnerGroups':
                renderPartnerGroups(view);
                break;
            case 'partnerDebts':
                renderPartnerDebts(view);
                break;
            case 'safes':
                renderSafes(view);
                break;
            case 'transfers':
                renderTransfers(view);
                break;
            case 'vouchers':
                renderVouchers(view);
                break;
            case 'brokers':
                renderBrokers(view);
                break;
            case 'brokerDues':
                renderBrokerDues(view);
                break;
            case 'auditLog':
                renderAuditLog(view);
                break;
            case 'reports':
                renderReports(view);
                break;
            case 'settings':
                renderSettings(view);
                break;
            default:
                view.innerHTML = '<div class="card"><h2>صفحة غير موجودة</h2></div>';
        }
        return;
    }

    // Always show dashboard, even with empty data
    // The dashboard will show 0 for empty data, which is fine

    switch (appState.currentView) {
        case 'dash':
            renderDashboard(view);
            break;
        case 'customers':
            renderCustomers(view);
            break;
        case 'units':
            renderUnits(view);
            break;
        case 'contracts':
            renderContracts(view);
            break;
        case 'partners':
            renderPartners(view);
            break;
        case 'safes':
            renderSafes(view);
            break;
        case 'transfers':
            renderTransfers(view);
            break;
        case 'vouchers':
            renderVouchers(view);
            break;
        case 'reports':
            renderReports(view);
            break;
        case 'settings':
            renderSettings(view);
            break;
        default:
            view.innerHTML = '<div class="card"><h2>صفحة غير موجودة</h2></div>';
    }
}

function renderDashboard(container) {
    const totalCustomers = appState.customers.length;
    const totalUnits = appState.units.length;
    const totalContracts = appState.contracts.length;
    const totalSafes = appState.safes.reduce((sum, safe) => sum + (safe.balance || 0), 0);

    container.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h1>لوحة التحكم</h1>
                <p>نظرة عامة على الاستثمار العقاري</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <h3>العملاء</h3>
                        <p class="stat-number">${totalCustomers}</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🏠</div>
                    <div class="stat-content">
                        <h3>الوحدات</h3>
                        <p class="stat-number">${totalUnits}</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <h3>العقود</h3>
                        <p class="stat-number">${totalContracts}</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <h3>رصيد الخزائن</h3>
                        <p class="stat-number">${totalSafes.toLocaleString()} ج.م</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCustomers(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>العملاء</h1>
        </div>
        <div class="page-content">
            <!-- Add Customer Form -->
            <div class="card" style="margin-bottom: 20px;">
                <h3>إضافة عميل جديد</h3>
                <form id="customer-form" class="form-grid">
                    <div class="form-field">
                        <label>الاسم</label>
                        <input type="text" id="customer-name" required>
                    </div>
                    <div class="form-field">
                        <label>الهاتف</label>
                        <input type="tel" id="customer-phone">
                    </div>
                    <div class="form-field">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="customer-email">
                    </div>
                    <div class="form-field">
                        <label>العنوان</label>
                        <textarea id="customer-address"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">حفظ العميل</button>
                        <button type="button" class="btn btn-secondary" onclick="clearCustomerForm()">مسح</button>
                    </div>
                </form>
            </div>
            
            <!-- Search and Filters -->
            <div class="filters">
                <input type="text" id="customer-search" placeholder="البحث في العملاء..." class="form-control">
            </div>
            
            <!-- Customers Table -->
            <div id="customers-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>الهاتف</th>
                                <th>البريد الإلكتروني</th>
                                <th>العنوان</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.customers.map(customer => `
                                <tr>
                                    <td>${customer.name || 'غير محدد'}</td>
                                    <td>${customer.phone || 'غير محدد'}</td>
                                    <td>${customer.email || 'غير محدد'}</td>
                                    <td>${customer.address || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="editCustomer('${customer.id || Math.random()}')">تعديل</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id || Math.random()}')">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderUnits(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>الوحدات</h1>
        </div>
        <div class="page-content">
            <!-- Add Unit Form -->
            <div class="card" style="margin-bottom: 20px;">
                <h3>إضافة وحدة جديدة</h3>
                <form id="unit-form" class="form-grid">
                    <div class="form-field">
                        <label>رقم الوحدة</label>
                        <input type="text" id="unit-number" required>
                    </div>
                    <div class="form-field">
                        <label>النوع</label>
                        <select id="unit-type" required>
                            <option value="">اختر النوع</option>
                            <option value="شقة">شقة</option>
                            <option value="فيلا">فيلا</option>
                            <option value="محل">محل</option>
                            <option value="مكتب">مكتب</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>المساحة (م²)</label>
                        <input type="number" id="unit-area" required>
                    </div>
                    <div class="form-field">
                        <label>السعر (ج.م)</label>
                        <input type="number" id="unit-price" required>
                    </div>
                    <div class="form-field">
                        <label>الحالة</label>
                        <select id="unit-status" required>
                            <option value="متاح">متاح</option>
                            <option value="محجوز">محجوز</option>
                            <option value="مباع">مباع</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">حفظ الوحدة</button>
                        <button type="button" class="btn btn-secondary" onclick="clearUnitForm()">مسح</button>
                    </div>
                </form>
            </div>
            
            <!-- Units Table -->
            <div id="units-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>رقم الوحدة</th>
                                <th>النوع</th>
                                <th>المساحة</th>
                                <th>السعر</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.units.map(unit => `
                                <tr>
                                    <td>${unit.unitNumber || 'غير محدد'}</td>
                                    <td>${unit.type || 'غير محدد'}</td>
                                    <td>${unit.area || 'غير محدد'}</td>
                                    <td>${(unit.price || 0).toLocaleString()} ج.م</td>
                                    <td>${unit.status || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="editUnit('${unit.id || Math.random()}')">تعديل</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteUnit('${unit.id || Math.random()}')">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderContracts(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>العقود</h1>
            <button class="btn btn-primary" id="add-contract-btn">+ إضافة عقد</button>
        </div>
        <div class="page-content">
            <div id="contracts-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>رقم العقد</th>
                                <th>العميل</th>
                                <th>الوحدة</th>
                                <th>السعر الإجمالي</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.contracts.map(contract => `
                                <tr>
                                    <td>${contract.contractNumber || 'غير محدد'}</td>
                                    <td>${contract.customerName || 'غير محدد'}</td>
                                    <td>${contract.unitNumber || 'غير محدد'}</td>
                                    <td>${(contract.totalPrice || 0).toLocaleString()} ج.م</td>
                                    <td>${contract.status || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPartners(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>الشركاء</h1>
        </div>
        <div class="page-content">
            <!-- Add Partner Form -->
            <div class="card" style="margin-bottom: 20px;">
                <h3>إضافة شريك جديد</h3>
                <form id="partner-form" class="form-grid">
                    <div class="form-field">
                        <label>الاسم</label>
                        <input type="text" id="partner-name" required>
                    </div>
                    <div class="form-field">
                        <label>النسبة (%)</label>
                        <input type="number" id="partner-percentage" min="0" max="100" required>
                    </div>
                    <div class="form-field">
                        <label>الهاتف</label>
                        <input type="tel" id="partner-phone">
                    </div>
                    <div class="form-field">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="partner-email">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">حفظ الشريك</button>
                        <button type="button" class="btn btn-secondary" onclick="clearPartnerForm()">مسح</button>
                    </div>
                </form>
            </div>
            
            <!-- Partners Table -->
            <div id="partners-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>النسبة</th>
                                <th>الهاتف</th>
                                <th>البريد الإلكتروني</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.partners.map(partner => `
                                <tr>
                                    <td>${partner.name || 'غير محدد'}</td>
                                    <td>${partner.percentage || 0}%</td>
                                    <td>${partner.phone || 'غير محدد'}</td>
                                    <td>${partner.email || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="editPartner('${partner.id || Math.random()}')">تعديل</button>
                                        <button class="btn btn-sm btn-danger" onclick="deletePartner('${partner.id || Math.random()}')">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderSafes(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>الخزائن</h1>
        </div>
        <div class="page-content">
            <!-- Add Safe Form -->
            <div class="card" style="margin-bottom: 20px;">
                <h3>إضافة خزنة جديدة</h3>
                <form id="safe-form" class="form-grid">
                    <div class="form-field">
                        <label>اسم الخزنة</label>
                        <input type="text" id="safe-name" required>
                    </div>
                    <div class="form-field">
                        <label>الرصيد الابتدائي (ج.م)</label>
                        <input type="number" id="safe-balance" value="0" min="0">
                    </div>
                    <div class="form-field">
                        <label>الوصف</label>
                        <textarea id="safe-description"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">حفظ الخزنة</button>
                        <button type="button" class="btn btn-secondary" onclick="clearSafeForm()">مسح</button>
                    </div>
                </form>
            </div>
            
            <!-- Safes Table -->
            <div id="safes-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>اسم الخزنة</th>
                                <th>الرصيد</th>
                                <th>الوصف</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.safes.map(safe => `
                                <tr>
                                    <td>${safe.name || 'غير محدد'}</td>
                                    <td>${(safe.balance || 0).toLocaleString()} ج.م</td>
                                    <td>${safe.description || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="editSafe('${safe.id || Math.random()}')">تعديل</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteSafe('${safe.id || Math.random()}')">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderTransfers(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>التحويلات</h1>
            <button class="btn btn-primary" id="add-transfer-btn">+ إضافة تحويل</button>
        </div>
        <div class="page-content">
            <div id="transfers-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>من</th>
                                <th>إلى</th>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.transfers.map(transfer => `
                                <tr>
                                    <td>${transfer.from || 'غير محدد'}</td>
                                    <td>${transfer.to || 'غير محدد'}</td>
                                    <td>${(transfer.amount || 0).toLocaleString()} ج.م</td>
                                    <td>${transfer.date || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderVouchers(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>السندات</h1>
            <button class="btn btn-primary" id="add-voucher-btn">+ إضافة سند</button>
        </div>
        <div class="page-content">
            <div id="vouchers-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>رقم السند</th>
                                <th>النوع</th>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.vouchers.map(voucher => `
                                <tr>
                                    <td>${voucher.voucherNumber || 'غير محدد'}</td>
                                    <td>${voucher.type || 'غير محدد'}</td>
                                    <td>${(voucher.amount || 0).toLocaleString()} ج.م</td>
                                    <td>${voucher.date || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderReports(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>التقارير</h1>
        </div>
        <div class="page-content">
            <div class="reports-grid">
                <div class="report-card">
                    <h3>تقرير المبيعات</h3>
                    <p>تقرير شامل عن المبيعات والإيرادات</p>
                    <button class="btn btn-primary">عرض التقرير</button>
                </div>
                <div class="report-card">
                    <h3>تقرير العملاء</h3>
                    <p>تقرير تفصيلي عن العملاء</p>
                    <button class="btn btn-primary">عرض التقرير</button>
                </div>
                <div class="report-card">
                    <h3>تقرير الوحدات</h3>
                    <p>تقرير حالة الوحدات</p>
                    <button class="btn btn-primary">عرض التقرير</button>
                </div>
            </div>
        </div>
    `;
}

// Missing render functions for all pages
function renderInstallments(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>الأقساط</h1>
            <button class="btn btn-primary" id="add-installment-btn">+ إضافة قسط</button>
        </div>
        <div class="page-content">
            <div id="installments-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>رقم القسط</th>
                                <th>العقد</th>
                                <th>المبلغ</th>
                                <th>تاريخ الاستحقاق</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.installments.map(installment => `
                                <tr>
                                    <td>${installment.installmentNumber || 'غير محدد'}</td>
                                    <td>${installment.contractNumber || 'غير محدد'}</td>
                                    <td>${(installment.amount || 0).toLocaleString()} ج.م</td>
                                    <td>${installment.dueDate || 'غير محدد'}</td>
                                    <td>${installment.status || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPartnerGroups(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>مجموعات الشركاء</h1>
            <button class="btn btn-primary" id="add-partner-group-btn">+ إضافة مجموعة</button>
        </div>
        <div class="page-content">
            <div id="partner-groups-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>اسم المجموعة</th>
                                <th>الوصف</th>
                                <th>عدد الشركاء</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.partnerGroups.map(group => `
                                <tr>
                                    <td>${group.name || 'غير محدد'}</td>
                                    <td>${group.description || 'غير محدد'}</td>
                                    <td>${group.partnerCount || 0}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPartnerDebts(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>ديون الشركاء</h1>
            <button class="btn btn-primary" id="add-partner-debt-btn">+ إضافة دين</button>
        </div>
        <div class="page-content">
            <div id="partner-debts-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الشريك</th>
                                <th>المبلغ</th>
                                <th>تاريخ الدين</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.partnerDebts.map(debt => `
                                <tr>
                                    <td>${debt.partnerName || 'غير محدد'}</td>
                                    <td>${(debt.amount || 0).toLocaleString()} ج.م</td>
                                    <td>${debt.debtDate || 'غير محدد'}</td>
                                    <td>${debt.status || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderBrokers(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>الوسطاء</h1>
            <button class="btn btn-primary" id="add-broker-btn">+ إضافة وسيط</button>
        </div>
        <div class="page-content">
            <div id="brokers-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>الهاتف</th>
                                <th>النسبة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.brokers.map(broker => `
                                <tr>
                                    <td>${broker.name || 'غير محدد'}</td>
                                    <td>${broker.phone || 'غير محدد'}</td>
                                    <td>${broker.percentage || 0}%</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderBrokerDues(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>عمولات الوسطاء</h1>
            <button class="btn btn-primary" id="add-broker-due-btn">+ إضافة عمولة</button>
        </div>
        <div class="page-content">
            <div id="broker-dues-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الوسيط</th>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.brokerDues.map(due => `
                                <tr>
                                    <td>${due.brokerName || 'غير محدد'}</td>
                                    <td>${(due.amount || 0).toLocaleString()} ج.م</td>
                                    <td>${due.date || 'غير محدد'}</td>
                                    <td>${due.status || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn-edit" data-type="عميل" data-id="${customer.id || Math.random()}">تعديل</button>
                                        <button class="btn-delete" data-type="عميل" data-id="${customer.id || Math.random()}">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderAuditLog(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>سجل المراجعة</h1>
        </div>
        <div class="page-content">
            <div id="audit-log-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>المستخدم</th>
                                <th>الإجراء</th>
                                <th>التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.auditLog.map(log => `
                                <tr>
                                    <td>${log.date || 'غير محدد'}</td>
                                    <td>${log.user || 'غير محدد'}</td>
                                    <td>${log.action || 'غير محدد'}</td>
                                    <td>${log.details || 'غير محدد'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderSettings(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1>الإعدادات</h1>
        </div>
        <div class="page-content">
            <div class="settings-grid">
                <div class="settings-card">
                    <h3>المظهر</h3>
                    <div class="form-field">
                        <label>السمة</label>
                        <select id="theme-setting">
                            <option value="dark" ${appState.settings.theme === 'dark' ? 'selected' : ''}>داكن</option>
                            <option value="light" ${appState.settings.theme === 'light' ? 'selected' : ''}>فاتح</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>حجم الخط</label>
                        <select id="font-setting">
                            <option value="14" ${appState.settings.font === 14 ? 'selected' : ''}>صغير (14px)</option>
                            <option value="16" ${appState.settings.font === 16 ? 'selected' : ''}>متوسط (16px)</option>
                            <option value="18" ${appState.settings.font === 18 ? 'selected' : ''}>كبير (18px)</option>
                        </select>
                    </div>
                </div>
                <div class="settings-card">
                    <h3>البيانات</h3>
                    <div class="form-field">
                        <button class="btn btn-secondary" id="clear-cache-btn">مسح الذاكرة المؤقتة</button>
                        <button class="btn btn-secondary" id="refresh-data-btn">تحديث البيانات</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Event listeners
function setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            const view = navItem.dataset.view;
            if (view) {
                appState.currentView = view;
                renderMainContent();
                updateNavigation();
            }
        }
        
        // Form submissions
        if (e.target.id === 'customer-form') {
            e.preventDefault();
            addCustomer();
        } else if (e.target.id === 'unit-form') {
            e.preventDefault();
            addUnit();
        } else if (e.target.id === 'partner-form') {
            e.preventDefault();
            addPartner();
        } else if (e.target.id === 'safe-form') {
            e.preventDefault();
            addSafe();
        }
    });

    // Theme selector
    document.getElementById('themeSel')?.addEventListener('change', (e) => {
        const theme = e.target.value;
        appState.settings.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        showNotification('تم تحديث السمة', 'success');
    });

    // Font selector
    document.getElementById('fontSel')?.addEventListener('change', (e) => {
        const font = parseInt(e.target.value);
        appState.settings.font = font;
        document.documentElement.style.fontSize = `${font}px`;
        showNotification('تم تحديث حجم الخط', 'success');
    });

    // Lock button
    document.getElementById('lockBtn')?.addEventListener('click', () => {
        if (appState.locked) {
            const password = prompt('أدخل كلمة المرور لإلغاء القفل:');
            if (password === appState.settings.pass) {
                appState.locked = false;
                showNotification('تم إلغاء القفل', 'success');
                renderHeader();
            } else {
                showNotification('كلمة المرور غير صحيحة', 'error');
            }
        } else {
            const password = prompt('أدخل كلمة مرور جديدة للقفل:');
            if (password) {
                appState.settings.pass = password;
                appState.locked = true;
                showNotification('تم تفعيل القفل', 'success');
                renderHeader();
            }
        }
    });

    // Cache management buttons
    document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        showNotification('تم مسح الذاكرة المؤقتة', 'success');
    });

    document.getElementById('refresh-data-btn')?.addEventListener('click', async () => {
        showLoading('جاري تحديث البيانات...');
        localStorage.removeItem(CONFIG.CACHE_KEY);
        await loadData();
        renderMainContent();
        hideLoading();
        showNotification('تم تحديث البيانات', 'success');
    });
}

function updateNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`nav-${appState.currentView}`)?.classList.add('active');
}

// Initialize app with instant loading
async function initializeApp() {
    try {
        console.log('Starting app initialization...');
        
        // Render UI immediately for instant display
        renderHeader();
        renderSidebar();
        renderMainContent();
        
        // Setup event listeners
        setupEventListeners();
        
        // Apply settings
        document.documentElement.setAttribute('data-theme', appState.settings.theme);
        document.documentElement.style.fontSize = `${appState.settings.font}px`;
        
        // Load data in background (non-blocking)
        loadData().then(async () => {
            await createInitialSafe();
            console.log('Data loaded successfully');
            // Refresh the current view after data is loaded
            renderMainContent();
            updateNavigation();
            showNotification('تم تحميل التطبيق بنجاح!', 'success');
        }).catch(error => {
            console.error('Data loading failed, but app will continue:', error);
            showNotification('تم تحميل التطبيق مع تحذير في البيانات', 'warning');
        });
        
        console.log('App initialization completed - UI ready instantly');
        
    } catch (error) {
        showNotification('فشل في تحميل التطبيق: ' + error.message, 'error');
        console.error('App initialization failed:', error);
    }
}

// Modal functions
function showAddCustomerModal() {
    showModal('إضافة عميل جديد', `
        <form id="customer-form">
            <div class="form-field">
                <label>الاسم</label>
                <input type="text" id="customer-name" required>
            </div>
            <div class="form-field">
                <label>الهاتف</label>
                <input type="tel" id="customer-phone">
            </div>
            <div class="form-field">
                <label>البريد الإلكتروني</label>
                <input type="email" id="customer-email">
            </div>
            <div class="form-field">
                <label>العنوان</label>
                <textarea id="customer-address"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">حفظ</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
            </div>
        </form>
    `);
    
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const customer = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
            email: document.getElementById('customer-email').value,
            address: document.getElementById('customer-address').value
        };
        
        try {
            await api.put('customers', customer);
            appState.customers.push(customer);
            renderMainContent();
            closeModal();
            showNotification('تم إضافة العميل بنجاح', 'success');
        } catch (error) {
            showNotification('فشل في إضافة العميل', 'error');
        }
    });
}

function showAddUnitModal() {
    showModal('إضافة وحدة جديدة', `
        <form id="unit-form">
            <div class="form-field">
                <label>رقم الوحدة</label>
                <input type="text" id="unit-number" required>
            </div>
            <div class="form-field">
                <label>النوع</label>
                <select id="unit-type" required>
                    <option value="">اختر النوع</option>
                    <option value="شقة">شقة</option>
                    <option value="فيلا">فيلا</option>
                    <option value="محل">محل</option>
                    <option value="مكتب">مكتب</option>
                </select>
            </div>
            <div class="form-field">
                <label>المساحة (م²)</label>
                <input type="number" id="unit-area" required>
            </div>
            <div class="form-field">
                <label>السعر (ج.م)</label>
                <input type="number" id="unit-price" required>
            </div>
            <div class="form-field">
                <label>الحالة</label>
                <select id="unit-status" required>
                    <option value="متاح">متاح</option>
                    <option value="محجوز">محجوز</option>
                    <option value="مباع">مباع</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">حفظ</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
            </div>
        </form>
    `);
    
    document.getElementById('unit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const unit = {
            unitNumber: document.getElementById('unit-number').value,
            type: document.getElementById('unit-type').value,
            area: parseInt(document.getElementById('unit-area').value),
            price: parseInt(document.getElementById('unit-price').value),
            status: document.getElementById('unit-status').value
        };
        
        try {
            await api.put('units', unit);
            appState.units.push(unit);
            renderMainContent();
            closeModal();
            showNotification('تم إضافة الوحدة بنجاح', 'success');
        } catch (error) {
            showNotification('فشل في إضافة الوحدة', 'error');
        }
    });
}

function showAddPartnerModal() {
    showModal('إضافة شريك جديد', `
        <form id="partner-form">
            <div class="form-field">
                <label>الاسم</label>
                <input type="text" id="partner-name" required>
            </div>
            <div class="form-field">
                <label>النسبة (%)</label>
                <input type="number" id="partner-percentage" min="0" max="100" required>
            </div>
            <div class="form-field">
                <label>الهاتف</label>
                <input type="tel" id="partner-phone">
            </div>
            <div class="form-field">
                <label>البريد الإلكتروني</label>
                <input type="email" id="partner-email">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">حفظ</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
            </div>
        </form>
    `);
    
    document.getElementById('partner-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const partner = {
            name: document.getElementById('partner-name').value,
            percentage: parseInt(document.getElementById('partner-percentage').value),
            phone: document.getElementById('partner-phone').value,
            email: document.getElementById('partner-email').value
        };
        
        try {
            await api.put('partners', partner);
            appState.partners.push(partner);
            renderMainContent();
            closeModal();
            showNotification('تم إضافة الشريك بنجاح', 'success');
        } catch (error) {
            showNotification('فشل في إضافة الشريك', 'error');
        }
    });
}

function showAddSafeModal() {
    showModal('إضافة خزنة جديدة', `
        <form id="safe-form">
            <div class="form-field">
                <label>اسم الخزنة</label>
                <input type="text" id="safe-name" required>
            </div>
            <div class="form-field">
                <label>الرصيد الابتدائي (ج.م)</label>
                <input type="number" id="safe-balance" value="0" min="0">
            </div>
            <div class="form-field">
                <label>الوصف</label>
                <textarea id="safe-description"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">حفظ</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
            </div>
        </form>
    `);
    
    document.getElementById('safe-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const safe = {
            name: document.getElementById('safe-name').value,
            balance: parseInt(document.getElementById('safe-balance').value) || 0,
            description: document.getElementById('safe-description').value
        };
        
        try {
            await api.put('safes', safe);
            appState.safes.push(safe);
            renderMainContent();
            closeModal();
            showNotification('تم إضافة الخزنة بنجاح', 'success');
        } catch (error) {
            showNotification('فشل في إضافة الخزنة', 'error');
        }
    });
}

// Generic modal functions
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
    `;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.remove();
    }
}

// Generic add modal functions for other entities
function showAddContractModal() { showModal('إضافة عقد جديد', '<p>نموذج إضافة عقد سيتم إضافته قريباً</p>'); }
function showAddTransferModal() { showModal('إضافة تحويل جديد', '<p>نموذج إضافة تحويل سيتم إضافته قريباً</p>'); }
function showAddVoucherModal() { showModal('إضافة سند جديد', '<p>نموذج إضافة سند سيتم إضافته قريباً</p>'); }
function showAddInstallmentModal() { showModal('إضافة قسط جديد', '<p>نموذج إضافة قسط سيتم إضافته قريباً</p>'); }
function showAddPartnerGroupModal() { showModal('إضافة مجموعة شركاء جديدة', '<p>نموذج إضافة مجموعة شركاء سيتم إضافته قريباً</p>'); }
function showAddPartnerDebtModal() { showModal('إضافة دين شريك جديد', '<p>نموذج إضافة دين شريك سيتم إضافته قريباً</p>'); }
function showAddBrokerModal() { showModal('إضافة وسيط جديد', '<p>نموذج إضافة وسيط سيتم إضافته قريباً</p>'); }
function showAddBrokerDueModal() { showModal('إضافة عمولة وسيط جديدة', '<p>نموذج إضافة عمولة وسيط سيتم إضافته قريباً</p>'); }

function showEditModal(type, id) {
    showNotification(`تعديل ${type} - سيتم إضافته قريباً`, 'info');
}

function deleteItem(type, id) {
    if (confirm(`هل أنت متأكد من حذف ${type}؟`)) {
        showNotification(`حذف ${type} - سيتم إضافته قريباً`, 'info');
    }
}

// Form functions
async function addCustomer() {
    const customer = {
        id: Date.now().toString(),
        name: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        email: document.getElementById('customer-email').value,
        address: document.getElementById('customer-address').value
    };
    
    try {
        console.log('Adding customer:', customer);
        await api.post('customers', customer);
        appState.customers.push(customer);
        renderMainContent();
        clearCustomerForm();
        showNotification('تم إضافة العميل بنجاح', 'success');
    } catch (error) {
        console.error('Error adding customer:', error);
        showNotification('فشل في إضافة العميل: ' + error.message, 'error');
    }
}

async function addUnit() {
    const unit = {
        id: Date.now().toString(),
        unitNumber: document.getElementById('unit-number').value,
        type: document.getElementById('unit-type').value,
        area: parseInt(document.getElementById('unit-area').value),
        price: parseInt(document.getElementById('unit-price').value),
        status: document.getElementById('unit-status').value
    };
    
    try {
        console.log('Adding unit:', unit);
        await api.post('units', unit);
        appState.units.push(unit);
        renderMainContent();
        clearUnitForm();
        showNotification('تم إضافة الوحدة بنجاح', 'success');
    } catch (error) {
        console.error('Error adding unit:', error);
        showNotification('فشل في إضافة الوحدة: ' + error.message, 'error');
    }
}

async function addPartner() {
    const partner = {
        id: Date.now().toString(),
        name: document.getElementById('partner-name').value,
        percentage: parseInt(document.getElementById('partner-percentage').value),
        phone: document.getElementById('partner-phone').value,
        email: document.getElementById('partner-email').value
    };
    
    try {
        console.log('Adding partner:', partner);
        await api.post('partners', partner);
        appState.partners.push(partner);
        renderMainContent();
        clearPartnerForm();
        showNotification('تم إضافة الشريك بنجاح', 'success');
    } catch (error) {
        console.error('Error adding partner:', error);
        showNotification('فشل في إضافة الشريك: ' + error.message, 'error');
    }
}

async function addSafe() {
    const safe = {
        id: Date.now().toString(),
        name: document.getElementById('safe-name').value,
        balance: parseInt(document.getElementById('safe-balance').value) || 0,
        description: document.getElementById('safe-description').value
    };
    
    try {
        console.log('Adding safe:', safe);
        await api.post('safes', safe);
        appState.safes.push(safe);
        renderMainContent();
        clearSafeForm();
        showNotification('تم إضافة الخزنة بنجاح', 'success');
    } catch (error) {
        console.error('Error adding safe:', error);
        showNotification('فشل في إضافة الخزنة: ' + error.message, 'error');
    }
}

// Clear form functions
function clearCustomerForm() {
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-address').value = '';
}

function clearUnitForm() {
    document.getElementById('unit-number').value = '';
    document.getElementById('unit-type').value = '';
    document.getElementById('unit-area').value = '';
    document.getElementById('unit-price').value = '';
    document.getElementById('unit-status').value = 'متاح';
}

function clearPartnerForm() {
    document.getElementById('partner-name').value = '';
    document.getElementById('partner-percentage').value = '';
    document.getElementById('partner-phone').value = '';
    document.getElementById('partner-email').value = '';
}

function clearSafeForm() {
    document.getElementById('safe-name').value = '';
    document.getElementById('safe-balance').value = '0';
    document.getElementById('safe-description').value = '';
}

// Edit/Delete functions
function editCustomer(id) {
    showNotification('تعديل العميل - سيتم إضافته قريباً', 'info');
}

function deleteCustomer(id) {
    if (confirm('هل أنت متأكد من حذف العميل؟')) {
        showNotification('حذف العميل - سيتم إضافته قريباً', 'info');
    }
}

function editUnit(id) {
    showNotification('تعديل الوحدة - سيتم إضافته قريباً', 'info');
}

function deleteUnit(id) {
    if (confirm('هل أنت متأكد من حذف الوحدة؟')) {
        showNotification('حذف الوحدة - سيتم إضافته قريباً', 'info');
    }
}

// Additional functions
function editPartner(id) {
    showNotification('تعديل الشريك - سيتم إضافته قريباً', 'info');
}

function deletePartner(id) {
    if (confirm('هل أنت متأكد من حذف الشريك؟')) {
        showNotification('حذف الشريك - سيتم إضافته قريباً', 'info');
    }
}

function editSafe(id) {
    showNotification('تعديل الخزنة - سيتم إضافته قريباً', 'info');
}

function deleteSafe(id) {
    if (confirm('هل أنت متأكد من حذف الخزنة؟')) {
        showNotification('حذف الخزنة - سيتم إضافته قريباً', 'info');
    }
}

// Make functions global
window.clearCustomerForm = clearCustomerForm;
window.clearUnitForm = clearUnitForm;
window.clearPartnerForm = clearPartnerForm;
window.clearSafeForm = clearSafeForm;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.editUnit = editUnit;
window.deleteUnit = deleteUnit;
window.editPartner = editPartner;
window.deletePartner = deletePartner;
window.editSafe = editSafe;
window.deleteSafe = deleteSafe;

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);