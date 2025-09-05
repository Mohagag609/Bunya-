// Estate Management System - Frontend Application
let currentView = 'dash';
let currentData = {};

// Initialize application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Check if user is already logged in
        if (api.token) {
            try {
                const profile = await api.getProfile();
                showAuthenticatedUI(profile.user);
            } catch (error) {
                console.log('Token invalid, showing login form');
                api.logout();
                showLoginUI();
            }
        } else {
            showLoginUI();
        }

        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        api.showError('فشل في تحميل التطبيق');
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            if (view) {
                navigateToView(view);
            }
        });
    });

    // Error close
    document.getElementById('errorClose').addEventListener('click', () => {
        api.hideError();
    });
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        api.showError('الرجاء إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    try {
        api.showLoading();
        const response = await api.login(username, password);
        showAuthenticatedUI(response.user);
        api.hideLoading();
    } catch (error) {
        api.hideLoading();
        api.showError('فشل في تسجيل الدخول: ' + error.message);
    }
}

async function handleLogout() {
    try {
        await api.logout();
        showLoginUI();
    } catch (error) {
        console.error('Logout error:', error);
        showLoginUI();
    }
}

function showLoginUI() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('nav').style.display = 'none';
    document.getElementById('main').style.display = 'none';
}

function showAuthenticatedUI(user) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = user.fullName || user.username;
    document.getElementById('nav').style.display = 'flex';
    document.getElementById('main').style.display = 'block';
    
    // Load dashboard
    navigateToView('dash');
}

async function navigateToView(view) {
    try {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        currentView = view;
        api.showLoading();

        // Load view content
        switch (view) {
            case 'dash':
                await loadDashboard();
                break;
            case 'customers':
                await loadCustomers();
                break;
            case 'units':
                await loadUnits();
                break;
            case 'partners':
                await loadPartners();
                break;
            case 'contracts':
                await loadContracts();
                break;
            case 'safes':
                await loadSafes();
                break;
            case 'vouchers':
                await loadVouchers();
                break;
            case 'reports':
                await loadReports();
                break;
            default:
                document.getElementById('view').innerHTML = '<div class="card"><h3>صفحة غير موجودة</h3></div>';
        }

        api.hideLoading();
    } catch (error) {
        api.hideLoading();
        api.showError('فشل في تحميل الصفحة: ' + error.message);
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const data = await api.getDashboard();
        const { summary, recentContracts, recentVouchers } = data;

        const html = `
            <div class="dashboard">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>العملاء</h3>
                        <div class="stat-number">${summary.customersCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>الوحدات</h3>
                        <div class="stat-number">${summary.unitsCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>العقود</h3>
                        <div class="stat-number">${summary.contractsCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>إجمالي الإيرادات</h3>
                        <div class="stat-number">${api.formatCurrency(summary.totalRevenue)}</div>
                    </div>
                    <div class="stat-card">
                        <h3>رصيد الخزن</h3>
                        <div class="stat-number">${api.formatCurrency(summary.safesBalance)}</div>
                    </div>
                </div>

                <div class="dashboard-content">
                    <div class="card">
                        <h3>أحدث العقود</h3>
                        <div class="table-container">
                            ${recentContracts.length > 0 ? 
                                generateTable(
                                    ['الكود', 'العميل', 'الوحدة', 'المبلغ', 'التاريخ'],
                                    recentContracts.map(c => [
                                        c.code,
                                        c.customer_name || 'غير محدد',
                                        c.unit_code || 'غير محدد',
                                        api.formatCurrency(c.total_price),
                                        api.formatDate(c.created_at)
                                    ])
                                ) : '<p>لا توجد عقود</p>'
                            }
                        </div>
                    </div>

                    <div class="card">
                        <h3>أحدث السندات</h3>
                        <div class="table-container">
                            ${recentVouchers.length > 0 ? 
                                generateTable(
                                    ['النوع', 'المبلغ', 'الخزنة', 'التاريخ'],
                                    recentVouchers.map(v => [
                                        v.type === 'receipt' ? 'إيصال' : 'دفع',
                                        api.formatCurrency(v.amount),
                                        v.safe_name || 'غير محدد',
                                        api.formatDate(v.date)
                                    ])
                                ) : '<p>لا توجد سندات</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Customers
async function loadCustomers() {
    try {
        const data = await api.getCustomers();
        const { customers, pagination } = data;

        const html = `
            <div class="customers">
                <div class="page-header">
                    <h2>العملاء</h2>
                    <button class="btn" onclick="showAddCustomerForm()">إضافة عميل</button>
                </div>

                <div class="search-bar">
                    <input type="text" id="customerSearch" placeholder="البحث في العملاء..." onkeyup="searchCustomers()">
                </div>

                <div class="table-container">
                    ${generateTable(
                        ['الاسم', 'الهاتف', 'الرقم القومي', 'العنوان', 'الحالة', 'الإجراءات'],
                        customers.map(c => [
                            c.name,
                            c.phone || 'غير محدد',
                            c.national_id || 'غير محدد',
                            c.address || 'غير محدد',
                            c.status,
                            `<button class="btn btn-sm" onclick="editCustomer('${c.id}')">تعديل</button>
                             <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${c.id}')">حذف</button>`
                        ])
                    )}
                </div>

                ${pagination.pages > 1 ? generatePagination(pagination) : ''}
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Units
async function loadUnits() {
    try {
        const data = await api.getUnits();
        const { units, pagination } = data;

        const html = `
            <div class="units">
                <div class="page-header">
                    <h2>الوحدات</h2>
                    <button class="btn" onclick="showAddUnitForm()">إضافة وحدة</button>
                </div>

                <div class="search-bar">
                    <input type="text" id="unitSearch" placeholder="البحث في الوحدات..." onkeyup="searchUnits()">
                    <select id="statusFilter" onchange="filterUnits()">
                        <option value="">جميع الحالات</option>
                        <option value="متاحة">متاحة</option>
                        <option value="محجوزة">محجوزة</option>
                        <option value="مباعة">مباعة</option>
                    </select>
                </div>

                <div class="table-container">
                    ${generateTable(
                        ['الكود', 'الاسم', 'النوع', 'المساحة', 'الدور', 'العمارة', 'السعر', 'الحالة', 'الإجراءات'],
                        units.map(u => [
                            u.code,
                            u.name || 'غير محدد',
                            u.unit_type,
                            u.area || 'غير محدد',
                            u.floor || 'غير محدد',
                            u.building || 'غير محدد',
                            api.formatCurrency(u.total_price),
                            u.status,
                            `<button class="btn btn-sm" onclick="editUnit('${u.id}')">تعديل</button>
                             <button class="btn btn-sm btn-danger" onclick="deleteUnit('${u.id}')">حذف</button>`
                        ])
                    )}
                </div>

                ${pagination.pages > 1 ? generatePagination(pagination) : ''}
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Partners
async function loadPartners() {
    try {
        const data = await api.getPartners();
        const { partners, pagination } = data;

        const html = `
            <div class="partners">
                <div class="page-header">
                    <h2>الشركاء</h2>
                    <button class="btn" onclick="showAddPartnerForm()">إضافة شريك</button>
                </div>

                <div class="search-bar">
                    <input type="text" id="partnerSearch" placeholder="البحث في الشركاء..." onkeyup="searchPartners()">
                </div>

                <div class="table-container">
                    ${generateTable(
                        ['الاسم', 'الهاتف', 'الإجراءات'],
                        partners.map(p => [
                            p.name,
                            p.phone || 'غير محدد',
                            `<button class="btn btn-sm" onclick="editPartner('${p.id}')">تعديل</button>
                             <button class="btn btn-sm btn-danger" onclick="deletePartner('${p.id}')">حذف</button>`
                        ])
                    )}
                </div>

                ${pagination.pages > 1 ? generatePagination(pagination) : ''}
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Contracts
async function loadContracts() {
    try {
        const data = await api.getContracts();
        const { contracts, pagination } = data;

        const html = `
            <div class="contracts">
                <div class="page-header">
                    <h2>العقود</h2>
                    <button class="btn" onclick="showAddContractForm()">إضافة عقد</button>
                </div>

                <div class="search-bar">
                    <input type="text" id="contractSearch" placeholder="البحث في العقود..." onkeyup="searchContracts()">
                </div>

                <div class="table-container">
                    ${generateTable(
                        ['الكود', 'العميل', 'الوحدة', 'المبلغ الإجمالي', 'الدفعة المقدمة', 'النوع', 'تاريخ البدء', 'الإجراءات'],
                        contracts.map(c => [
                            c.code,
                            c.customer_name || 'غير محدد',
                            c.unit_code || 'غير محدد',
                            api.formatCurrency(c.total_price),
                            api.formatCurrency(c.down_payment),
                            c.type === 'cash' ? 'نقدي' : 'أقساط',
                            api.formatDate(c.start_date),
                            `<button class="btn btn-sm" onclick="editContract('${c.id}')">تعديل</button>
                             <button class="btn btn-sm btn-danger" onclick="deleteContract('${c.id}')">حذف</button>`
                        ])
                    )}
                </div>

                ${pagination.pages > 1 ? generatePagination(pagination) : ''}
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Safes
async function loadSafes() {
    try {
        const data = await api.getSafes();
        const { safes } = data;

        const html = `
            <div class="safes">
                <div class="page-header">
                    <h2>الخزن</h2>
                    <button class="btn" onclick="showAddSafeForm()">إضافة خزنة</button>
                </div>

                <div class="table-container">
                    ${generateTable(
                        ['الاسم', 'الرصيد', 'الإجراءات'],
                        safes.map(s => [
                            s.name,
                            api.formatCurrency(s.balance),
                            `<button class="btn btn-sm" onclick="editSafe('${s.id}')">تعديل</button>
                             <button class="btn btn-sm btn-danger" onclick="deleteSafe('${s.id}')">حذف</button>`
                        ])
                    )}
                </div>
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Vouchers
async function loadVouchers() {
    try {
        const data = await api.getVouchers();
        const { vouchers, pagination } = data;

        const html = `
            <div class="vouchers">
                <div class="page-header">
                    <h2>السندات</h2>
                    <button class="btn" onclick="showAddVoucherForm()">إضافة سند</button>
                </div>

                <div class="search-bar">
                    <input type="text" id="voucherSearch" placeholder="البحث في السندات..." onkeyup="searchVouchers()">
                    <select id="typeFilter" onchange="filterVouchers()">
                        <option value="">جميع الأنواع</option>
                        <option value="receipt">إيصال</option>
                        <option value="payment">دفع</option>
                    </select>
                </div>

                <div class="table-container">
                    ${generateTable(
                        ['النوع', 'المبلغ', 'الخزنة', 'الوصف', 'المدفوع له/من', 'التاريخ', 'الإجراءات'],
                        vouchers.map(v => [
                            v.type === 'receipt' ? 'إيصال' : 'دفع',
                            api.formatCurrency(v.amount),
                            v.safe_name || 'غير محدد',
                            v.description || 'غير محدد',
                            v.payer || v.beneficiary || 'غير محدد',
                            api.formatDate(v.date),
                            `<button class="btn btn-sm" onclick="editVoucher('${v.id}')">تعديل</button>
                             <button class="btn btn-sm btn-danger" onclick="deleteVoucher('${v.id}')">حذف</button>`
                        ])
                    )}
                </div>

                ${pagination.pages > 1 ? generatePagination(pagination) : ''}
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Reports
async function loadReports() {
    try {
        const [financial, units, contracts] = await Promise.all([
            api.getFinancialReport(),
            api.getUnitsReport(),
            api.getContractsReport()
        ]);

        const html = `
            <div class="reports">
                <h2>التقارير</h2>

                <div class="reports-grid">
                    <div class="card">
                        <h3>التقرير المالي</h3>
                        <div class="report-stats">
                            <div class="stat-item">
                                <span>إجمالي الإيصالات:</span>
                                <span>${api.formatCurrency(financial.totalReceipts)}</span>
                            </div>
                            <div class="stat-item">
                                <span>إجمالي المدفوعات:</span>
                                <span>${api.formatCurrency(financial.totalPayments)}</span>
                            </div>
                            <div class="stat-item">
                                <span>صافي الدخل:</span>
                                <span>${api.formatCurrency(financial.netIncome)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h3>تقرير الوحدات</h3>
                        <div class="report-stats">
                            <div class="stat-item">
                                <span>متوسط السعر:</span>
                                <span>${api.formatCurrency(units.averagePrice)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h3>تقرير العقود</h3>
                        <div class="report-stats">
                            <div class="stat-item">
                                <span>إجمالي العقود:</span>
                                <span>${contracts.contractsByType.reduce((sum, c) => sum + parseInt(c.count), 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('view').innerHTML = html;
    } catch (error) {
        throw error;
    }
}

// Utility functions
function generateTable(headers, rows) {
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const bodyRows = rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `
        <table class="table">
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
}

function generatePagination(pagination) {
    const { page, pages } = pagination;
    let paginationHTML = '<div class="pagination">';
    
    for (let i = 1; i <= pages; i++) {
        const activeClass = i === page ? 'active' : '';
        paginationHTML += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    paginationHTML += '</div>';
    return paginationHTML;
}

// Placeholder functions for CRUD operations
function showAddCustomerForm() {
    // Implementation for add customer form
    alert('إضافة عميل - سيتم تنفيذها لاحقاً');
}

function editCustomer(id) {
    // Implementation for edit customer
    alert(`تعديل العميل ${id} - سيتم تنفيذها لاحقاً`);
}

async function deleteCustomer(id) {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        try {
            await api.deleteCustomer(id);
            await loadCustomers();
        } catch (error) {
            api.showError('فشل في حذف العميل: ' + error.message);
        }
    }
}

function showAddUnitForm() {
    alert('إضافة وحدة - سيتم تنفيذها لاحقاً');
}

function editUnit(id) {
    alert(`تعديل الوحدة ${id} - سيتم تنفيذها لاحقاً`);
}

async function deleteUnit(id) {
    if (confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
        try {
            await api.deleteUnit(id);
            await loadUnits();
        } catch (error) {
            api.showError('فشل في حذف الوحدة: ' + error.message);
        }
    }
}

function showAddPartnerForm() {
    alert('إضافة شريك - سيتم تنفيذها لاحقاً');
}

function editPartner(id) {
    alert(`تعديل الشريك ${id} - سيتم تنفيذها لاحقاً`);
}

async function deletePartner(id) {
    if (confirm('هل أنت متأكد من حذف هذا الشريك؟')) {
        try {
            await api.deletePartner(id);
            await loadPartners();
        } catch (error) {
            api.showError('فشل في حذف الشريك: ' + error.message);
        }
    }
}

function showAddContractForm() {
    alert('إضافة عقد - سيتم تنفيذها لاحقاً');
}

function editContract(id) {
    alert(`تعديل العقد ${id} - سيتم تنفيذها لاحقاً`);
}

async function deleteContract(id) {
    if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
        try {
            await api.deleteContract(id);
            await loadContracts();
        } catch (error) {
            api.showError('فشل في حذف العقد: ' + error.message);
        }
    }
}

function showAddSafeForm() {
    alert('إضافة خزنة - سيتم تنفيذها لاحقاً');
}

function editSafe(id) {
    alert(`تعديل الخزنة ${id} - سيتم تنفيذها لاحقاً`);
}

async function deleteSafe(id) {
    if (confirm('هل أنت متأكد من حذف هذه الخزنة؟')) {
        try {
            await api.deleteSafe(id);
            await loadSafes();
        } catch (error) {
            api.showError('فشل في حذف الخزنة: ' + error.message);
        }
    }
}

function showAddVoucherForm() {
    alert('إضافة سند - سيتم تنفيذها لاحقاً');
}

function editVoucher(id) {
    alert(`تعديل السند ${id} - سيتم تنفيذها لاحقاً`);
}

async function deleteVoucher(id) {
    if (confirm('هل أنت متأكد من حذف هذا السند؟')) {
        try {
            await api.deleteVoucher(id);
            await loadVouchers();
        } catch (error) {
            api.showError('فشل في حذف السند: ' + error.message);
        }
    }
}

// Search functions
function searchCustomers() {
    const search = document.getElementById('customerSearch').value;
    // Implementation for customer search
    console.log('Searching customers:', search);
}

function searchUnits() {
    const search = document.getElementById('unitSearch').value;
    // Implementation for unit search
    console.log('Searching units:', search);
}

function searchPartners() {
    const search = document.getElementById('partnerSearch').value;
    // Implementation for partner search
    console.log('Searching partners:', search);
}

function searchContracts() {
    const search = document.getElementById('contractSearch').value;
    // Implementation for contract search
    console.log('Searching contracts:', search);
}

function searchVouchers() {
    const search = document.getElementById('voucherSearch').value;
    // Implementation for voucher search
    console.log('Searching vouchers:', search);
}

function filterUnits() {
    const status = document.getElementById('statusFilter').value;
    // Implementation for unit filtering
    console.log('Filtering units by status:', status);
}

function filterVouchers() {
    const type = document.getElementById('typeFilter').value;
    // Implementation for voucher filtering
    console.log('Filtering vouchers by type:', type);
}

function goToPage(page) {
    // Implementation for pagination
    console.log('Going to page:', page);
}