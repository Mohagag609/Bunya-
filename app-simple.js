/* ===== GLOBAL STATE & CONFIG ===== */
let state = {};
let historyStack = [];
let historyIndex = -1;
let currentView = 'dash';
let currentParam = null;

/* ===== CORE APP INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('ServiceWorker registered.', reg))
                .catch(err => console.error('ServiceWorker registration failed:', err));
        });
    }

    try {
        // Initialize with localStorage
        console.log("Loading state from localStorage...");
        state = await loadStateFromLocalStorage();
        
        // Ensure state has default empty arrays for all stores if they are null/undefined
        const COLLECTIONS = ['customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments', 'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues', 'brokers', 'partnerGroups'];
        COLLECTIONS.forEach(collection => {
            if (!state[collection]) {
                state[collection] = [];
            }
        });
        
        if (typeof state.settings !== 'object' || state.settings === null) { 
            state.settings = {theme:'dark',font:16, pass:null}; 
        }
        if (!state.locked) { state.locked = false; }
        
        // Check if we have any safes, if not create default
        if (!state.safes || state.safes.length === 0) {
            const defaultSafe = { id: uid('S'), name: 'الخزنة الرئيسية', balance: 0 };
            state.safes = [defaultSafe];
            await persist();
        }

        // Setup UI and global event listeners
        applySettings();
        setupGlobalEventListeners();
        checkLock();
        saveState(); // Save initial state for undo/redo
        updateUndoRedoButtons();
        createTabs(); // Create navigation tabs
        nav('dash');
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        const viewEl = document.getElementById('view');
        if (viewEl) {
            viewEl.innerHTML = `<div class="card warn"><h3>خطأ فادح</h3><p>لم يتمكن التطبيق من التحميل. قد تكون قاعدة البيانات تالفة أو أن متصفحك لا يدعم localStorage.</p><pre>${error.stack}</pre></div>`;
        }
    }
}

/* ===== DATA PERSISTENCE & MIGRATION ===== */
async function persist() {
    try {
        // Save to localStorage
        localStorage.setItem('estate_pro_state', JSON.stringify(state));
        applySettings();
    } catch (error) {
        console.error('Failed to persist data:', error);
        throw error;
    }
}

async function loadStateFromLocalStorage() {
    try {
        const stored = localStorage.getItem('estate_pro_state');
        if (!stored) {
            return {
                customers: [], units: [], partners: [], unitPartners: [], contracts: [],
                installments: [], partnerDebts: [], safes: [], transfers: [], auditLog: [],
                vouchers: [], brokerDues: [], brokers: [], partnerGroups: [],
                settings: {theme:'dark',font:16, pass:null}, locked: false
            };
        }
        
        const data = JSON.parse(stored);
        
        // Handle migration from old data structure
        if (data.payments && data.payments.length > 0 && data.vouchers.length === 0) {
            console.log('Migrating payments to vouchers...');
            data.payments.forEach(p => {
                const unit = data.units.find(u => u.id === p.unitId);
                const contract = data.contracts.find(c => c.unitId === p.unitId);
                const customer = contract ? data.customers.find(cust => cust.id === contract.customerId) : null;
                data.vouchers.push({
                    id: uid('V'), type: 'receipt', date: p.date, amount: p.amount,
                    safeId: p.safeId, description: `دفعة للوحدة ${unit ? unit.code : 'غير معروفة'}`,
                    payer: customer ? customer.name : 'غير محدد', linked_ref: p.unitId
                });
            });
            data.contracts.forEach(c => {
                if (c.brokerAmount > 0) {
                    const unit = data.units.find(u => u.id === c.unitId);
                    data.vouchers.push({
                        id: uid('V'), type: 'payment', date: c.start, amount: c.brokerAmount,
                        safeId: c.commissionSafeId, description: `عمولة سمسار للوحدة ${unit ? unit.code : 'غير معروفة'}`,
                        beneficiary: c.brokerName || 'سمسار', linked_ref: c.id
                    });
                }
            });
        }
        
        if (data.brokers.length === 0 && (data.contracts.some(c => c.brokerName) || data.brokerDues.some(d => d.brokerName))) {
            console.log('Populating brokers list from existing data...');
            const brokerNames = new Set([...data.contracts.map(c => c.brokerName), ...data.brokerDues.map(d => d.brokerName)].filter(Boolean));
            brokerNames.forEach(name => {
                data.brokers.push({ id: uid('B'), name: name, phone: '', notes: '' });
            });
        }
        
        return data;
    } catch (error) {
        console.error('Failed to load state from localStorage:', error);
        // Return empty state if loading fails
        return {
            customers: [], units: [], partners: [], unitPartners: [], contracts: [],
            installments: [], partnerDebts: [], safes: [], transfers: [], auditLog: [],
            vouchers: [], brokerDues: [], brokers: [], partnerGroups: [],
            settings: {theme:'dark',font:16, pass:null}, locked: false
        };
    }
}

/* ===== UNDO/REDO ===== */
async function undo() { if (historyIndex > 0) { historyIndex--; const restoredState = JSON.parse(JSON.stringify(historyStack[historyIndex])); Object.keys(state).forEach(key => delete state[key]); Object.assign(state, restoredState); await persist(); nav(currentView, currentParam); updateUndoRedoButtons(); } }
async function redo() { if (historyIndex < historyStack.length - 1) { historyIndex++; const restoredState = JSON.parse(JSON.stringify(historyStack[historyIndex])); Object.keys(state).forEach(key => delete state[key]); Object.assign(state, restoredState); await persist(); nav(currentView, currentParam); updateUndoRedoButtons(); } }
function saveState() { historyStack = historyStack.slice(0, historyIndex + 1); historyStack.push(JSON.parse(JSON.stringify(state))); if (historyStack.length > 50) { historyStack.shift(); } historyIndex = historyStack.length - 1; updateUndoRedoButtons(); }
function updateUndoRedoButtons() { const undoBtn = document.getElementById('undoBtn'); const redoBtn = document.getElementById('redoBtn'); if (undoBtn) undoBtn.disabled = historyIndex <= 0; if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1; }

function setupGlobalEventListeners() {
    document.getElementById('themeSel').value = state.settings.theme || 'dark';
    document.getElementById('fontSel').value = String(state.settings.font || 16);

    document.getElementById('themeSel').addEventListener('change', async (e) => { state.settings.theme = e.target.value; await persist(); });
    document.getElementById('fontSel').addEventListener('change', async (e) => { state.settings.font = Number(e.target.value); await persist(); });
    document.getElementById('lockBtn').addEventListener('click', async () => {
        const pass = prompt('ضع كلمة مرور أو اتركها فارغة لإلغاء القفل', '');
        state.locked = !!pass;
        state.settings.pass = pass || null;
        await persist();
        alert(state.locked ? 'تم تفعيل القفل' : 'تم إلغاء القفل');
        checkLock();
    });
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);

    document.addEventListener('keydown', (e) => {
        const targetNode = e.target.nodeName.toLowerCase();
        if (targetNode === 'input' || targetNode === 'textarea' || e.target.isContentEditable) return;
        if (e.ctrlKey) {
            if (e.key === 'z') { e.preventDefault(); undo(); }
            else if (e.key === 'y') { e.preventDefault(); redo(); }
        }
    });
}

/* ===== UTILS & HELPERS ===== */
function uid(p){ return p+'-'+Math.random().toString(36).slice(2,9); }
function today(){ return new Date().toISOString().slice(0,10); }
async function logAction(description, details = {}) { 
    if (!state.auditLog) state.auditLog = []; 
    const logEntry = { id: uid('LOG'), timestamp: new Date().toISOString(), description, details };
    state.auditLog.push(logEntry);
    await persist();
}
const fmt = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function egp(v){ v=Number(v||0); return isFinite(v)?fmt.format(v)+' ج.م':'' }
function applySettings(){ if(state && state.settings) { document.documentElement.setAttribute('data-theme', state.settings.theme||'dark'); document.documentElement.style.fontSize=(state.settings.font||16)+'px'; } }
function checkLock(){ if(state.locked){ const p=prompt('اكتب كلمة المرور للدخول'); if(p!==state.settings.pass){ alert('كلمة مرور غير صحيحة'); location.reload(); } } }
function unitById(id){ return state.units.find(u=>u.id===id); }
function custById(id){ return state.customers.find(c=>c.id===id); }
function partnerById(id){ return state.partners.find(p=>p.id===id); }
function brokerById(id){ return state.brokers.find(b=>b.id===id); }
function unitCode(id){ return (unitById(id)||{}).code||'—'; }
function getUnitDisplayName(unit) { if (!unit) return '—'; const name = unit.name ? `اسم الوحدة (${unit.name})` : ''; const floor = unit.floor ? `رقم الدور (${unit.floor})` : ''; const building = unit.building ? `رقم العمارة (${unit.building})` : ''; return [name, floor, building].filter(Boolean).join(' '); }
function parseNumber(v){ v=String(v||'').replace(/[^\d.]/g,''); return Number(v||0); }

/* ===== ROUTING & UI ===== */
function nav(id, param = null){
    currentView = id;
    currentParam = param;
    const viewEl = document.getElementById('view');
    if (!viewEl) return;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-view="${id}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Render the appropriate view
    if (typeof window[`render${id.charAt(0).toUpperCase() + id.slice(1)}`] === 'function') {
        window[`render${id.charAt(0).toUpperCase() + id.slice(1)}`](param);
    } else {
        viewEl.innerHTML = `<div class="card"><h3>عرض غير متاح</h3><p>العرض "${id}" غير متاح حالياً.</p></div>`;
    }
}

function createTabs() {
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) return;
    
    const tabs = [
        { id: 'dash', label: 'لوحة التحكم', icon: '📊' },
        { id: 'customers', label: 'العملاء', icon: '👥' },
        { id: 'units', label: 'الوحدات', icon: '🏠' },
        { id: 'partners', label: 'الشركاء', icon: '🤝' },
        { id: 'contracts', label: 'العقود', icon: '📋' },
        { id: 'installments', label: 'الدفعات', icon: '💰' },
        { id: 'safes', label: 'الخزائن', icon: '🏦' },
        { id: 'reports', label: 'التقارير', icon: '📈' }
    ];
    
    tabsContainer.innerHTML = tabs.map(tab => 
        `<button class="tab" data-view="${tab.id}" onclick="nav('${tab.id}')">
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-label">${tab.label}</span>
        </button>`
    ).join('');
}

// Dashboard view
function renderDash() {
    const view = document.getElementById('view');
    if (!view) return;
    
    // Calculate statistics
    const stats = {
        totalUnits: state.units.length,
        availableUnits: state.units.filter(u => u.status === 'متاحة').length,
        soldUnits: state.units.filter(u => u.status === 'مباعة').length,
        reservedUnits: state.units.filter(u => u.status === 'محجوزة').length,
        totalCustomers: state.customers.length,
        totalPartners: state.partners.length,
        totalContracts: state.contracts.length,
        totalSafes: state.safes.length
    };
    
    const totalBalance = state.safes.reduce((sum, safe) => sum + (safe.balance || 0), 0);
    
    view.innerHTML = `
        <div class="dashboard">
            <h2>لوحة التحكم</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>الوحدات</h3>
                    <div class="stat-value">${stats.totalUnits}</div>
                    <div class="stat-details">
                        <span>متاحة: ${stats.availableUnits}</span>
                        <span>مباعة: ${stats.soldUnits}</span>
                        <span>محجوزة: ${stats.reservedUnits}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <h3>العملاء</h3>
                    <div class="stat-value">${stats.totalCustomers}</div>
                </div>
                <div class="stat-card">
                    <h3>الشركاء</h3>
                    <div class="stat-value">${stats.totalPartners}</div>
                </div>
                <div class="stat-card">
                    <h3>العقود</h3>
                    <div class="stat-value">${stats.totalContracts}</div>
                </div>
                <div class="stat-card">
                    <h3>إجمالي الخزائن</h3>
                    <div class="stat-value">${egp(totalBalance)}</div>
                </div>
            </div>
        </div>
    `;
}

// Draw function to refresh the current view
function draw() {
    if (typeof window[`render${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`] === 'function') {
        window[`render${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`](currentParam);
    }
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}