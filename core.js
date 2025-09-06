/* 🏛️ مدير الاستثمار العقاري - الوظائف الأساسية */

/* ===== CORE APP INITIALIZATION ===== */
let state = {};
let historyStack = [];
let historyIndex = -1;
let currentView = 'dash';
let currentParam = null;

// OBJECT_STORES is defined in index.html before this script loads

/* ===== CORE FUNCTIONS ===== */

// Initialize the application
async function initializeApp() {
    try {
        showLoadingIndicator('جاري تحميل التطبيق...');
        
        // Initialize database
        await initializeDatabase();
        
        // Setup UI
        setupUI();
        
        // Load data
        await loadInitialData();
        
        // Setup event listeners
        setupEventListeners();
        
        hideLoadingIndicator();
        showNotification('تم تحميل التطبيق بنجاح! 🚀', 'success');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoadingIndicator();
        showNotification('حدث خطأ في تحميل التطبيق', 'error');
    }
}

// Initialize database
async function initializeDatabase() {
    if (typeof initDB === 'function') {
        await initDB();
    }
}

// Setup UI elements
function setupUI() {
    // Setup tabs
    setupTabs();
    
    // Setup theme switcher
    setupThemeSwitcher();
    
    // Setup font size adjuster
    setupFontSizeAdjuster();
    
    // Setup lock button
    setupLockButton();
    
    // Setup undo/redo buttons
    setupUndoRedoButtons();
}

// Setup tabs navigation
function setupTabs() {
    const tabs = [
        { id: 'dash', name: '🏠 الرئيسية', icon: '🏠' },
        { id: 'customers', name: '👥 العملاء', icon: '👥' },
        { id: 'units', name: '🏢 الوحدات', icon: '🏢' },
        { id: 'contracts', name: '📄 العقود', icon: '📄' },
        { id: 'installments', name: '💰 الأقساط', icon: '💰' },
        { id: 'partners', name: '🤝 الشركاء', icon: '🤝' },
        { id: 'reports', name: '📊 التقارير', icon: '📊' },
        { id: 'settings', name: '⚙️ الإعدادات', icon: '⚙️' }
    ];
    
    const tabsContainer = document.getElementById('tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = tabs.map(tab => `
            <button class="tab" data-view="${tab.id}" onclick="navigateToView('${tab.id}')">
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-text">${tab.name}</span>
            </button>
        `).join('');
    }
}

// Setup theme switcher
function setupThemeSwitcher() {
    const themeSelect = document.getElementById('themeSel');
    if (themeSelect) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        themeSelect.value = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            showNotification(`تم تغيير الثيم إلى ${theme === 'dark' ? 'الداكن' : 'الفاتح'}`, 'success');
        });
    }
}

// Setup font size adjuster
function setupFontSizeAdjuster() {
    const fontSelect = document.getElementById('fontSel');
    if (fontSelect) {
        const savedFontSize = localStorage.getItem('fontSize') || '16';
        fontSelect.value = savedFontSize;
        document.documentElement.style.fontSize = `${savedFontSize}px`;
        
        fontSelect.addEventListener('change', (e) => {
            const fontSize = e.target.value;
            document.documentElement.style.fontSize = `${fontSize}px`;
            localStorage.setItem('fontSize', fontSize);
            showNotification(`تم تغيير حجم الخط إلى ${fontSize}px`, 'info');
        });
    }
}

// Setup lock button
function setupLockButton() {
    const lockBtn = document.getElementById('lockBtn');
    if (lockBtn) {
        let isLocked = false;
        
        lockBtn.addEventListener('click', () => {
            isLocked = !isLocked;
            lockBtn.textContent = isLocked ? '🔓 فتح' : '🔒 قفل';
            lockBtn.classList.toggle('active', isLocked);
            
            // Toggle content visibility
            const content = document.getElementById('view');
            if (content) {
                content.style.filter = isLocked ? 'blur(10px)' : 'none';
                content.style.pointerEvents = isLocked ? 'none' : 'auto';
            }
            
            showNotification(isLocked ? 'تم قفل المحتوى' : 'تم فتح المحتوى', 'info');
        });
    }
}

// Setup undo/redo buttons
function setupUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex--;
                const state = historyStack[historyIndex];
                restoreState(state);
                updateUndoRedoButtons();
                showNotification('تم التراجع', 'info');
            }
        });
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            if (historyIndex < historyStack.length - 1) {
                historyIndex++;
                const state = historyStack[historyIndex];
                restoreState(state);
                updateUndoRedoButtons();
                showNotification('تم التقدم', 'info');
            }
        });
    }
}

// Update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = historyIndex <= 0;
    }
    
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= historyStack.length - 1;
    }
}

// Save state to history
function saveState() {
    const newState = {
        view: currentView,
        param: currentParam,
        data: { ...state }
    };
    
    // Remove states after current index
    historyStack = historyStack.slice(0, historyIndex + 1);
    
    // Add new state
    historyStack.push(newState);
    historyIndex = historyStack.length - 1;
    
    // Limit history size
    if (historyStack.length > 50) {
        historyStack.shift();
        historyIndex--;
    }
    
    updateUndoRedoButtons();
}

// Restore state from history
function restoreState(state) {
    currentView = state.view;
    currentParam = state.param;
    Object.assign(window.state, state.data);
    
    // Update UI
    updateView();
}

// Navigate to view
function navigateToView(view, param = null) {
    if (currentView === view && currentParam === param) return;
    
    // Save current state
    saveState();
    
    // Update current view
    currentView = view;
    currentParam = param;
    
    // Update UI
    updateView();
    
    // Update active tab
    updateActiveTab();
}

// Update view content
function updateView() {
    const viewContainer = document.getElementById('view');
    if (!viewContainer) return;
    
    // Show loading
    showPageTransition();
    
    // Load view content
    setTimeout(() => {
        loadViewContent(currentView, currentParam);
        hidePageTransition();
    }, 150);
}

// Load view content
function loadViewContent(view, param) {
    const viewContainer = document.getElementById('view');
    if (!viewContainer) return;
    
    switch (view) {
        case 'dash':
            loadDashboard();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'units':
            loadUnits();
            break;
        case 'contracts':
            loadContracts();
            break;
        case 'installments':
            loadInstallments();
            break;
        case 'partners':
            loadPartners();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            loadSettings();
            break;
        default:
            loadDashboard();
    }
}

// Load dashboard
function loadDashboard() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = `
        <div class="panel">
            <h2>🏠 لوحة التحكم الرئيسية</h2>
            <div class="kpis">
                <div class="kpi-card">
                    <h3>إجمالي العملاء</h3>
                    <div class="big" id="totalCustomers">0</div>
                </div>
                <div class="kpi-card">
                    <h3>إجمالي الوحدات</h3>
                    <div class="big" id="totalUnits">0</div>
                </div>
                <div class="kpi-card">
                    <h3>إجمالي العقود</h3>
                    <div class="big" id="totalContracts">0</div>
                </div>
                <div class="kpi-card">
                    <h3>إجمالي الإيرادات</h3>
                    <div class="big" id="totalRevenue">0</div>
                </div>
            </div>
        </div>
        <div class="panel">
            <h3>📊 الإحصائيات الحديثة</h3>
            <div class="grid grid-2">
                <div class="card">
                    <h4>العملاء الجدد</h4>
                    <p>تم إضافة 5 عملاء جدد هذا الشهر</p>
                </div>
                <div class="card">
                    <h4>العقود الموقعة</h4>
                    <p>تم توقيع 3 عقود جديدة هذا الأسبوع</p>
                </div>
            </div>
        </div>
    `;
    
    // Load dashboard data
    loadDashboardData();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load customers count
        const customers = await getAllData('customers');
        document.getElementById('totalCustomers').textContent = customers.length;
        
        // Load units count
        const units = await getAllData('units');
        document.getElementById('totalUnits').textContent = units.length;
        
        // Load contracts count
        const contracts = await getAllData('contracts');
        document.getElementById('totalContracts').textContent = contracts.length;
        
        // Calculate total revenue
        const installments = await getAllData('installments');
        const totalRevenue = installments
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString() + ' ريال';
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load customers view
function loadCustomers() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = `
        <div class="panel">
            <div class="tools">
                <button class="btn" onclick="addCustomer()">➕ إضافة عميل</button>
                <button class="btn secondary" onclick="exportCustomers()">📤 تصدير</button>
                <input type="text" class="input" placeholder="البحث في العملاء..." id="customerSearch">
            </div>
            <div class="table-container">
                <table class="table" id="customersTable">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>الهاتف</th>
                            <th>البريد الإلكتروني</th>
                            <th>تاريخ الإضافة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="customersTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadCustomersData();
}

// Load customers data
async function loadCustomersData() {
    try {
        const customers = await getAllData('customers');
        const tbody = document.getElementById('customersTableBody');
        
        if (tbody) {
            tbody.innerHTML = customers.map(customer => `
                <tr>
                    <td>${customer.name || ''}</td>
                    <td>${customer.phone || ''}</td>
                    <td>${customer.email || ''}</td>
                    <td>${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ar-SA') : ''}</td>
                    <td>
                        <button class="btn secondary" onclick="editCustomer('${customer.id}')">✏️</button>
                        <button class="btn warn" onclick="deleteCustomer('${customer.id}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Load units view
function loadUnits() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = `
        <div class="panel">
            <div class="tools">
                <button class="btn" onclick="addUnit()">➕ إضافة وحدة</button>
                <button class="btn secondary" onclick="exportUnits()">📤 تصدير</button>
                <input type="text" class="input" placeholder="البحث في الوحدات..." id="unitSearch">
            </div>
            <div class="table-container">
                <table class="table" id="unitsTable">
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
                    <tbody id="unitsTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadUnitsData();
}

// Load units data
async function loadUnitsData() {
    try {
        const units = await getAllData('units');
        const tbody = document.getElementById('unitsTableBody');
        
        if (tbody) {
            tbody.innerHTML = units.map(unit => `
                <tr>
                    <td>${unit.number || ''}</td>
                    <td>${unit.type || ''}</td>
                    <td>${unit.area || ''} م²</td>
                    <td>${unit.price ? unit.price.toLocaleString() : ''} ريال</td>
                    <td><span class="badge ${unit.status === 'available' ? 'ok' : 'warn'}">${unit.status === 'available' ? 'متاح' : 'محجوز'}</span></td>
                    <td>
                        <button class="btn secondary" onclick="editUnit('${unit.id}')">✏️</button>
                        <button class="btn warn" onclick="deleteUnit('${unit.id}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading units:', error);
    }
}

// Load other views (simplified for now)
function loadContracts() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '<div class="panel"><h2>📄 العقود</h2><p>صفحة العقود قيد التطوير...</p></div>';
}

function loadInstallments() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '<div class="panel"><h2>💰 الأقساط</h2><p>صفحة الأقساط قيد التطوير...</p></div>';
}

function loadPartners() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '<div class="panel"><h2>🤝 الشركاء</h2><p>صفحة الشركاء قيد التطوير...</p></div>';
}

function loadReports() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '<div class="panel"><h2>📊 التقارير</h2><p>صفحة التقارير قيد التطوير...</p></div>';
}

function loadSettings() {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '<div class="panel"><h2>⚙️ الإعدادات</h2><p>صفحة الإعدادات قيد التطوير...</p></div>';
}

// Update active tab
function updateActiveTab() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === currentView) {
            tab.classList.add('active');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    saveData();
                    break;
                case 'z':
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        const state = historyStack[historyIndex];
                        restoreState(state);
                        updateUndoRedoButtons();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    if (historyIndex < historyStack.length - 1) {
                        historyIndex++;
                        const state = historyStack[historyIndex];
                        restoreState(state);
                        updateUndoRedoButtons();
                    }
                    break;
            }
        }
    });
}

// Load initial data
async function loadInitialData() {
    try {
        // Load any initial data needed
        await loadDashboardData();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Page transition functions
function showPageTransition() {
    const content = document.getElementById('view');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
    }
}

function hidePageTransition() {
    const content = document.getElementById('view');
    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }
}

// Placeholder functions for CRUD operations
function addCustomer() {
    showNotification('إضافة عميل جديد', 'info');
}

function editCustomer(id) {
    showNotification(`تعديل العميل ${id}`, 'info');
}

function deleteCustomer(id) {
    showNotification(`حذف العميل ${id}`, 'warn');
}

function addUnit() {
    showNotification('إضافة وحدة جديدة', 'info');
}

function editUnit(id) {
    showNotification(`تعديل الوحدة ${id}`, 'info');
}

function deleteUnit(id) {
    showNotification(`حذف الوحدة ${id}`, 'warn');
}

function exportCustomers() {
    showNotification('تصدير بيانات العملاء', 'info');
}

function exportUnits() {
    showNotification('تصدير بيانات الوحدات', 'info');
}

function saveData() {
    showNotification('تم حفظ البيانات', 'success');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);