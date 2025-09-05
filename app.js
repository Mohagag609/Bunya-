// Estate Manager - Modern Version
// Main application file

// Global configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? `http://${window.location.hostname}:8000/api`
        : 'https://estate-manager-backend-vwop.onrender.com/api',
    OBJECT_STORES: [
        'customers', 'units', 'partners', 'unitPartners', 'contracts', 
        'installments', 'partnerDebts', 'safes', 'transfers', 'auditLog', 
        'vouchers', 'brokerDues', 'brokers', 'partnerGroups', 'settings', 'keyval'
    ]
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

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Initialize API service
const api = new ApiService();

// Load data from API
async function loadData() {
    console.log('Loading data from API...');
    
    for (const store of CONFIG.OBJECT_STORES) {
        try {
            console.log(`Loading ${store}...`);
            const data = await api.get(store);
            appState[store] = Array.isArray(data) ? data : [];
            console.log(`Loaded ${data.length || 0} items from ${store}`);
        } catch (error) {
            console.error(`Failed to load data for ${store}:`, error);
            appState[store] = [];
            // Don't throw error, just log it and continue
        }
    }
    
    console.log('Data loading completed');
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
        { id: 'partners', label: 'الشركاء', icon: '🤝' },
        { id: 'safes', label: 'الخزائن', icon: '💰' },
        { id: 'transfers', label: 'التحويلات', icon: '🔄' },
        { id: 'vouchers', label: 'السندات', icon: '🧾' },
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
            <button class="btn btn-primary" id="add-customer-btn">+ إضافة عميل</button>
        </div>
        <div class="page-content">
            <div class="filters">
                <input type="text" id="customer-search" placeholder="البحث في العملاء..." class="form-control">
            </div>
            <div id="customers-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>الهاتف</th>
                                <th>البريد الإلكتروني</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.customers.map(customer => `
                                <tr>
                                    <td>${customer.name || 'غير محدد'}</td>
                                    <td>${customer.phone || 'غير محدد'}</td>
                                    <td>${customer.email || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
            <button class="btn btn-primary" id="add-unit-btn">+ إضافة وحدة</button>
        </div>
        <div class="page-content">
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
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
            <button class="btn btn-primary" id="add-partner-btn">+ إضافة شريك</button>
        </div>
        <div class="page-content">
            <div id="partners-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>النسبة</th>
                                <th>الهاتف</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.partners.map(partner => `
                                <tr>
                                    <td>${partner.name || 'غير محدد'}</td>
                                    <td>${partner.percentage || 0}%</td>
                                    <td>${partner.phone || 'غير محدد'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
            <button class="btn btn-primary" id="add-safe-btn">+ إضافة خزنة</button>
        </div>
        <div class="page-content">
            <div id="safes-table">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>اسم الخزنة</th>
                                <th>الرصيد</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appState.safes.map(safe => `
                                <tr>
                                    <td>${safe.name || 'غير محدد'}</td>
                                    <td>${(safe.balance || 0).toLocaleString()} ج.م</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
                                        <button class="btn btn-sm btn-primary">تعديل</button>
                                        <button class="btn btn-sm btn-danger">حذف</button>
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
}

function updateNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`nav-${appState.currentView}`)?.classList.add('active');
}

// Initialize app
async function initializeApp() {
    try {
        console.log('Starting app initialization...');
        showLoading('جاري تحميل التطبيق...');
        
        // Render UI first
        renderHeader();
        renderSidebar();
        renderMainContent();
        
        // Setup event listeners
        setupEventListeners();
        
        // Apply settings
        document.documentElement.setAttribute('data-theme', appState.settings.theme);
        document.documentElement.style.fontSize = `${appState.settings.font}px`;
        
        // Load data from API (non-blocking)
        try {
            await loadData();
            await createInitialSafe();
            console.log('Data loaded successfully');
            // Refresh the current view after data is loaded
            renderMainContent();
            // Update navigation counts if needed
            updateNavigation();
        } catch (error) {
            console.error('Data loading failed, but app will continue:', error);
        }
        
        hideLoading();
        showNotification('تم تحميل التطبيق بنجاح!', 'success');
        console.log('App initialization completed');
        
    } catch (error) {
        hideLoading();
        showNotification('فشل في تحميل التطبيق: ' + error.message, 'error');
        console.error('App initialization failed:', error);
    }
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);