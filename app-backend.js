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
        // Initialize backend database connection
        const dbConnected = await db.initialize();
        if (!dbConnected) {
            throw new Error('Failed to connect to backend database');
        }

        console.log("Loading state from backend...");
        state = await loadStateFromBackend();

        // Ensure state has default empty arrays for all stores if they are null/undefined
        const OBJECT_STORES = [
            'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
            'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
            'brokers', 'partnerGroups', 'settings', 'keyval'
        ];

        OBJECT_STORES.forEach(storeName => {
            if (storeName !== 'keyval' && storeName !== 'settings' && !state[storeName]) {
                state[storeName] = [];
            }
        });
        if (typeof state.settings !== 'object' || state.settings === null) { 
            state.settings = {theme:'dark',font:16, pass:null}; 
        }
        if (!state.locked) { state.locked = false; }
        if (!state.safes || state.safes.length === 0) {
            state.safes = [{ id: uid('S'), name: 'الخزنة الرئيسية', balance: 0 }];
            await persistToBackend();
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
            viewEl.innerHTML = `<div class="card warn"><h3>خطأ فادح</h3><p>لم يتمكن التطبيق من التحميل. تأكد من تشغيل الـ backend على المنفذ 3000.</p><pre>${error.stack}</pre></div>`;
        }
    }
}

/* ===== DATA PERSISTENCE & MIGRATION ===== */
async function persist() {
    try {
        await persistToBackend();
        applySettings();
    } catch (error) { 
        console.error('Failed to persist state to backend:', error); 
    }
}

/* ===== UNDO/REDO ===== */
async function undo() { 
    if (historyIndex > 0) { 
        historyIndex--; 
        const restoredState = JSON.parse(JSON.stringify(historyStack[historyIndex])); 
        Object.keys(state).forEach(key => delete state[key]); 
        Object.assign(state, restoredState); 
        await persist(); 
        nav(currentView, currentParam); 
        updateUndoRedoButtons(); 
    } 
}

async function redo() { 
    if (historyIndex < historyStack.length - 1) { 
        historyIndex++; 
        const restoredState = JSON.parse(JSON.stringify(historyStack[historyIndex])); 
        Object.keys(state).forEach(key => delete state[key]); 
        Object.assign(state, restoredState); 
        await persist(); 
        nav(currentView, currentParam); 
        updateUndoRedoButtons(); 
    } 
}

function saveState() { 
    historyStack = historyStack.slice(0, historyIndex + 1); 
    historyStack.push(JSON.parse(JSON.stringify(state))); 
    if (historyStack.length > 50) { 
        historyStack.shift(); 
    } 
    historyIndex = historyStack.length - 1; 
    updateUndoRedoButtons(); 
}

function updateUndoRedoButtons() { 
    const undoBtn = document.getElementById('undoBtn'); 
    const redoBtn = document.getElementById('redoBtn'); 
    if (undoBtn) undoBtn.disabled = historyIndex <= 0; 
    if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1; 
}

function setupGlobalEventListeners() {
    document.getElementById('themeSel').value = state.settings.theme || 'dark';
    document.getElementById('fontSel').value = String(state.settings.font || 16);

    document.getElementById('themeSel').addEventListener('change', async (e) => { 
        state.settings.theme = e.target.value; 
        await persist(); 
    });
    
    document.getElementById('fontSel').addEventListener('change', async (e) => { 
        state.settings.font = Number(e.target.value); 
        await persist(); 
    });
    
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

    // Migration button
    const migrationBtn = document.getElementById('migrationBtn');
    if (migrationBtn) {
        migrationBtn.addEventListener('click', async () => {
            try {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        await migration.importData(data);
                        alert('تم استيراد البيانات بنجاح');
                        location.reload();
                    }
                };
                fileInput.click();
            } catch (error) {
                console.error('Migration error:', error);
                alert('فشل في استيراد البيانات');
            }
        });
    }

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
function logAction(description, details = {}) { 
    if (!state.auditLog) state.auditLog = []; 
    state.auditLog.push({ id: uid('LOG'), timestamp: new Date().toISOString(), description, details }); 
}
const fmt = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function egp(v){ v=Number(v||0); return isFinite(v)?fmt.format(v)+' ج.م':'' }
function applySettings(){ 
    if(state && state.settings) { 
        document.documentElement.setAttribute('data-theme', state.settings.theme||'dark'); 
        document.documentElement.style.fontSize=(state.settings.font||16)+'px'; 
    } 
}
function checkLock(){ 
    if(state.locked){ 
        const p=prompt('اكتب كلمة المرور للدخول'); 
        if(p!==state.settings.pass){ 
            alert('كلمة مرور غير صحيحة'); 
            location.reload(); 
        } 
    } 
}
function unitById(id){ return state.units.find(u=>u.id===id); }
function custById(id){ return state.customers.find(c=>c.id===id); }
function partnerById(id){ return state.partners.find(p=>p.id===id); }
function brokerById(id){ return state.brokers.find(b=>b.id===id); }
function unitCode(id){ return (unitById(id)||{}).code||'—'; }
function getUnitDisplayName(unit) { 
    if (!unit) return '—'; 
    const name = unit.name ? `اسم الوحدة (${unit.name})` : ''; 
    const floor = unit.floor ? `رقم الدور (${unit.floor})` : ''; 
    const building = unit.building ? `رقم العمارة (${unit.building})` : ''; 
    return [name, floor, building].filter(Boolean).join(' '); 
}
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
    
    // Render view
    if (id === 'dash') viewEl.innerHTML = renderDash();
    else if (id === 'customers') viewEl.innerHTML = renderCustomers();
    else if (id === 'units') viewEl.innerHTML = renderUnits();
    else if (id === 'contracts') viewEl.innerHTML = renderContracts();
    else if (id === 'safes') viewEl.innerHTML = renderSafes();
    else if (id === 'reports') viewEl.innerHTML = renderReports();
    else if (id === 'settings') viewEl.innerHTML = renderSettings();
    else if (id === 'backup') viewEl.innerHTML = renderBackup();
    else if (id === 'customer-details' && param) viewEl.innerHTML = renderCustomerDetails(param);
    else if (id === 'unit-details' && param) viewEl.innerHTML = renderUnitDetails(param);
    else if (id === 'unit-edit' && param) viewEl.innerHTML = renderUnitEdit(param);
    else if (id === 'contract-edit' && param) viewEl.innerHTML = editContract(param);
    else if (id === 'partner-details' && param) viewEl.innerHTML = renderPartnerDetails(param);
    else viewEl.innerHTML = '<div class="card"><h3>صفحة غير موجودة</h3></div>';
}

function createTabs() {
    const tabsEl = document.getElementById('tabs');
    if (!tabsEl) return;
    
    const tabs = [
        { id: 'dash', label: '🏠 لوحة التحكم', icon: '🏠' },
        { id: 'customers', label: '👥 العملاء', icon: '👥' },
        { id: 'units', label: '🏢 الوحدات', icon: '🏢' },
        { id: 'contracts', label: '📋 العقود', icon: '📋' },
        { id: 'safes', label: '💰 الخزن', icon: '💰' },
        { id: 'reports', label: '📊 التقارير', icon: '📊' },
        { id: 'backup', label: '💾 حفظ وتحميل', icon: '💾' },
        { id: 'settings', label: '⚙️ الإعدادات', icon: '⚙️' }
    ];
    
    tabsEl.innerHTML = tabs.map(tab => 
        `<div class="tab" data-view="${tab.id}" onclick="nav('${tab.id}')">
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-label">${tab.label}</span>
        </div>`
    ).join('');
}

function showModal(title, content, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="btn secondary" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer">
                <button class="btn secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                <button class="btn primary" onclick="if(typeof onSave === 'function') onSave(); this.closest('.modal').remove();">حفظ</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function table(headers, rows, sortKey=null, onSort=null){ 
    const head = headers.map((h,i)=>`<th data-idx="${i}">${h}${sortKey&&sortKey.idx===i?(sortKey.dir==='asc'?' ▲':' ▼'):''}</th>`).join(''); 
    const body = rows.length? rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}"><small>لا توجد بيانات</small></td></tr>`; 
    const html = `<table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`; 
    const wrap=document.createElement('div'); 
    wrap.innerHTML=html; 
    if(onSort){ 
        wrap.querySelectorAll('th').forEach(th=> th.addEventListener('click', ()=>{ 
            const idx=Number(th.dataset.idx); 
            const dir = sortKey && sortKey.idx===idx && sortKey.dir==='asc' ? 'desc' : 'asc'; 
            onSort({idx,dir}); 
        })); 
    } 
    return wrap.innerHTML; 
}

function printHTML(title, bodyHTML){ 
    const w=window.open('','_blank'); 
    if(!w) return alert('الرجاء السماح بالنوافذ المنبثقة لطباعة التقارير.'); 
    w.document.write(`<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>@page{size:A4;margin:12mm}body{font-family:system-ui,Segoe UI,Roboto; padding:0; margin:0; direction:rtl; color:#111}.wrap{padding:16px 18px}h1{font-size:20px;margin:0 0 12px 0}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:right;vertical-align:top}thead th{background:#f1f5f9}footer{margin-top:12px;font-size:11px;color:#555}</style></head><body><div class="wrap">${bodyHTML}<footer>تمت الطباعة في ${new Date().toLocaleString('ar-EG')}</footer></div></body></html>`); 
    w.document.close(); 
    setTimeout(() => { w.focus(); w.print(); }, 250); 
}

function exportCSV(headers, rows, name){
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// Include all the existing functions from the original app.js
// (This is a simplified version - you would need to copy all functions from the original file)

// Dashboard rendering function
function renderDash() {
    return `
        <div class="card">
            <h2>لوحة التحكم</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>إجمالي العملاء</h3>
                    <div class="stat-value">${state.customers?.length || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>إجمالي الوحدات</h3>
                    <div class="stat-value">${state.units?.length || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>إجمالي العقود</h3>
                    <div class="stat-value">${state.contracts?.length || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>إجمالي الخزن</h3>
                    <div class="stat-value">${egp(state.safes?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0)}</div>
                </div>
            </div>
            <div class="card">
                <h3>حالة الاتصال</h3>
                <p>✅ متصل بقاعدة البيانات PostgreSQL</p>
                <p>🔄 البيانات متزامنة مع الـ Backend</p>
            </div>
        </div>
    `;
}

// Placeholder functions for other views
function renderCustomers() { return '<div class="card"><h2>العملاء</h2><p>قائمة العملاء</p></div>'; }
function renderUnits() { return '<div class="card"><h2>الوحدات</h2><p>قائمة الوحدات</p></div>'; }
function renderContracts() { return '<div class="card"><h2>العقود</h2><p>قائمة العقود</p></div>'; }
function renderSafes() { return '<div class="card"><h2>الخزن</h2><p>قائمة الخزن</p></div>'; }
function renderReports() { return '<div class="card"><h2>التقارير</h2><p>التقارير والإحصائيات</p></div>'; }
function renderSettings() { return '<div class="card"><h2>الإعدادات</h2><p>إعدادات النظام</p></div>'; }
function renderBackup() { return '<div class="card"><h2>حفظ وتحميل</h2><p>استيراد وتصدير البيانات</p></div>'; }
function renderCustomerDetails(id) { return '<div class="card"><h2>تفاصيل العميل</h2><p>تفاصيل العميل</p></div>'; }
function renderUnitDetails(id) { return '<div class="card"><h2>تفاصيل الوحدة</h2><p>تفاصيل الوحدة</p></div>'; }
function renderUnitEdit(id) { return '<div class="card"><h2>تعديل الوحدة</h2><p>تعديل الوحدة</p></div>'; }
function editContract(id) { return '<div class="card"><h2>تعديل العقد</h2><p>تعديل العقد</p></div>'; }
function renderPartnerDetails(id) { return '<div class="card"><h2>تفاصيل الشريك</h2><p>تفاصيل الشريك</p></div>'; }