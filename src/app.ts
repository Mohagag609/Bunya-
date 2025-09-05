import { stateManager } from './services/state.js';
import { api } from './services/api.js';
import { showNotification, showError, showSuccess } from './components/Notification.js';
import { showLoading, hideLoading } from './components/Loading.js';
import type { AppState, UIState, NavigationItem } from './types/index.js';

// Main Application Class
export class EstateManagerApp {
    private static instance: EstateManagerApp;
    private isInitialized = false;

    private constructor() {}

    static getInstance(): EstateManagerApp {
        if (!EstateManagerApp.instance) {
            EstateManagerApp.instance = new EstateManagerApp();
        }
        return EstateManagerApp.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            showLoading('جاري تحميل التطبيق...');
            
            // Register Service Worker
            this.registerServiceWorker();
            
            // Load initial state
            await stateManager.loadStateFromAPI();
            
            // Setup UI
            this.setupUI();
            this.setupEventListeners();
            
            // Apply settings
            this.applySettings();
            
            this.isInitialized = true;
            hideLoading();
            showSuccess('تم تحميل التطبيق بنجاح!');
            
        } catch (error) {
            hideLoading();
            showError('فشل في تحميل التطبيق: ' + (error as Error).message);
            console.error('App initialization failed:', error);
        }
    }

    private registerServiceWorker(): void {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => {
                        console.log('ServiceWorker registered successfully:', reg);
                    })
                    .catch(err => {
                        console.error('ServiceWorker registration failed:', err);
                    });
            });
        }
    }

    private setupUI(): void {
        this.renderHeader();
        this.renderSidebar();
        this.renderMainContent();
        this.renderFooter();
    }

    private renderHeader(): void {
        const header = document.querySelector('.header') as HTMLElement;
        if (!header) return;

        const state = stateManager.getState();
        const uiState = stateManager.getUIState();

        header.innerHTML = `
            <div class="brand">
                <div class="logo">🏛️</div>
                <h1>مدير الاستثمار العقاري — النسخة المحدثة</h1>
            </div>
            <div class="tools">
                <button class="btn btn-secondary" id="undoBtn" ${!stateManager.canUndo() ? 'disabled' : ''}>
                    ↪️ تراجع
                </button>
                <button class="btn btn-secondary" id="redoBtn" ${!stateManager.canRedo() ? 'disabled' : ''}>
                    ↩️ تقدم
                </button>
                <select class="select" id="themeSel">
                    <option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>داكن</option>
                    <option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>فاتح</option>
                </select>
                <select class="select" id="fontSel">
                    <option value="14" ${state.settings.font === 14 ? 'selected' : ''}>خط 14</option>
                    <option value="16" ${state.settings.font === 16 ? 'selected' : ''}>خط 16</option>
                    <option value="18" ${state.settings.font === 18 ? 'selected' : ''}>خط 18</option>
                </select>
                <button class="btn btn-secondary" id="lockBtn">
                    ${state.locked ? '🔓 فتح' : '🔒 قفل'}
                </button>
            </div>
        `;
    }

    private renderSidebar(): void {
        const sidebar = document.querySelector('#tabs') as HTMLElement;
        if (!sidebar) return;

        const navigationItems: NavigationItem[] = [
            { id: 'dash', label: 'لوحة التحكم', icon: '📊', view: 'dash' },
            { id: 'customers', label: 'العملاء', icon: '👥', view: 'customers' },
            { id: 'units', label: 'الوحدات', icon: '🏠', view: 'units' },
            { id: 'contracts', label: 'العقود', icon: '📋', view: 'contracts' },
            { id: 'partners', label: 'الشركاء', icon: '🤝', view: 'partners' },
            { id: 'safes', label: 'الخزائن', icon: '💰', view: 'safes' },
            { id: 'transfers', label: 'التحويلات', icon: '🔄', view: 'transfers' },
            { id: 'vouchers', label: 'السندات', icon: '🧾', view: 'vouchers' },
            { id: 'reports', label: 'التقارير', icon: '📈', view: 'reports' },
            { id: 'settings', label: 'الإعدادات', icon: '⚙️', view: 'settings' }
        ];

        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                ${navigationItems.map(item => `
                    <button class="nav-item" data-view="${item.view}" id="nav-${item.id}">
                        <span class="nav-icon">${item.icon}</span>
                        <span class="nav-label">${item.label}</span>
                        ${item.count ? `<span class="nav-count">${item.count}</span>` : ''}
                    </button>
                `).join('')}
            </nav>
        `;
    }

    private renderMainContent(): void {
        const view = document.querySelector('#view') as HTMLElement;
        if (!view) return;

        const uiState = stateManager.getUIState();
        this.renderView(view, uiState.currentView, uiState.currentParam);
    }

    private renderFooter(): void {
        const footer = document.querySelector('.footer') as HTMLElement;
        if (!footer) {
            const mainLayout = document.querySelector('.main-layout');
            if (mainLayout) {
                mainLayout.insertAdjacentHTML('afterend', `
                    <div class="footer">
                        <div class="footer-content">
                            <p>💾 LocalStorage • PDF/CSV • بحث/فرز/تعديل مباشر • أقساط مرنة • عمولة/صيانة • تدفقات نقدية • فلاتر تاريخ للتقارير</p>
                        </div>
                    </div>
                `);
            }
        }
    }

    private renderView(container: HTMLElement, view: string, param?: string | null): void {
        switch (view) {
            case 'dash':
                this.renderDashboard(container);
                break;
            case 'customers':
                this.renderCustomers(container);
                break;
            case 'units':
                this.renderUnits(container);
                break;
            case 'contracts':
                this.renderContracts(container);
                break;
            case 'partners':
                this.renderPartners(container);
                break;
            case 'safes':
                this.renderSafes(container);
                break;
            case 'transfers':
                this.renderTransfers(container);
                break;
            case 'vouchers':
                this.renderVouchers(container);
                break;
            case 'reports':
                this.renderReports(container);
                break;
            case 'settings':
                this.renderSettings(container);
                break;
            default:
                container.innerHTML = '<div class="card"><h2>صفحة غير موجودة</h2><p>الصفحة المطلوبة غير موجودة.</p></div>';
        }
    }

    private renderDashboard(container: HTMLElement): void {
        const state = stateManager.getState();
        
        // Calculate statistics
        const totalCustomers = state.customers.length;
        const totalUnits = state.units.length;
        const totalContracts = state.contracts.length;
        const totalRevenue = state.contracts.reduce((sum, contract) => sum + (contract.totalPrice || 0), 0);
        const totalSafes = state.safes.reduce((sum, safe) => sum + (safe.balance || 0), 0);

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
                            <h3>إجمالي الإيرادات</h3>
                            <p class="stat-number">${new Intl.NumberFormat('ar-EG', {
                                style: 'currency',
                                currency: 'EGP',
                                minimumFractionDigits: 0
                            }).format(totalRevenue)}</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🏦</div>
                        <div class="stat-content">
                            <h3>رصيد الخزائن</h3>
                            <p class="stat-number">${new Intl.NumberFormat('ar-EG', {
                                style: 'currency',
                                currency: 'EGP',
                                minimumFractionDigits: 0
                            }).format(totalSafes)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-charts">
                    <div class="chart-card">
                        <h3>حالة الوحدات</h3>
                        <canvas id="units-chart"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>الإيرادات الشهرية</h3>
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Render charts
        this.renderUnitsChart();
        this.renderRevenueChart();
    }

    private renderUnitsChart(): void {
        const canvas = document.getElementById('units-chart') as HTMLCanvasElement;
        if (!canvas) return;

        const state = stateManager.getState();
        const unitsByStatus = state.units.reduce((acc, unit) => {
            acc[unit.status] = (acc[unit.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // This would use Chart.js in a real implementation
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Simple chart implementation
            ctx.fillStyle = '#667eea';
            ctx.fillRect(10, 10, 100, 20);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(10, 40, 100, 20);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(10, 70, 100, 20);
        }
    }

    private renderRevenueChart(): void {
        const canvas = document.getElementById('revenue-chart') as HTMLCanvasElement;
        if (!canvas) return;

        // This would use Chart.js in a real implementation
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Simple chart implementation
            ctx.fillStyle = '#667eea';
            ctx.fillRect(10, 10, 200, 100);
        }
    }

    private renderCustomers(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>العملاء</h1>
                <button class="btn btn-primary" id="add-customer-btn">+ إضافة عميل</button>
            </div>
            <div class="page-content">
                <div class="filters">
                    <input type="text" id="customer-search" placeholder="البحث في العملاء..." class="form-control">
                    <select id="customer-status-filter" class="form-control">
                        <option value="">جميع الحالات</option>
                        <option value="active">نشط</option>
                        <option value="inactive">غير نشط</option>
                    </select>
                </div>
                <div id="customers-table"></div>
            </div>
        `;
    }

    private renderUnits(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>الوحدات</h1>
                <button class="btn btn-primary" id="add-unit-btn">+ إضافة وحدة</button>
            </div>
            <div class="page-content">
                <div class="filters">
                    <input type="text" id="unit-search" placeholder="البحث في الوحدات..." class="form-control">
                    <select id="unit-status-filter" class="form-control">
                        <option value="">جميع الحالات</option>
                        <option value="available">متاح</option>
                        <option value="sold">مباع</option>
                        <option value="reserved">محجوز</option>
                    </select>
                </div>
                <div id="units-table"></div>
            </div>
        `;
    }

    private renderContracts(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>العقود</h1>
                <button class="btn btn-primary" id="add-contract-btn">+ إضافة عقد</button>
            </div>
            <div class="page-content">
                <div class="filters">
                    <input type="text" id="contract-search" placeholder="البحث في العقود..." class="form-control">
                    <select id="contract-status-filter" class="form-control">
                        <option value="">جميع الحالات</option>
                        <option value="active">نشط</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                    </select>
                </div>
                <div id="contracts-table"></div>
            </div>
        `;
    }

    private renderPartners(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>الشركاء</h1>
                <button class="btn btn-primary" id="add-partner-btn">+ إضافة شريك</button>
            </div>
            <div class="page-content">
                <div class="filters">
                    <input type="text" id="partner-search" placeholder="البحث في الشركاء..." class="form-control">
                </div>
                <div id="partners-table"></div>
            </div>
        `;
    }

    private renderSafes(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>الخزائن</h1>
                <button class="btn btn-primary" id="add-safe-btn">+ إضافة خزنة</button>
            </div>
            <div class="page-content">
                <div id="safes-table"></div>
            </div>
        `;
    }

    private renderTransfers(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>التحويلات</h1>
                <button class="btn btn-primary" id="add-transfer-btn">+ إضافة تحويل</button>
            </div>
            <div class="page-content">
                <div id="transfers-table"></div>
            </div>
        `;
    }

    private renderVouchers(container: HTMLElement): void {
        container.innerHTML = `
            <div class="page-header">
                <h1>السندات</h1>
                <button class="btn btn-primary" id="add-voucher-btn">+ إضافة سند</button>
            </div>
            <div class="page-content">
                <div class="filters">
                    <input type="text" id="voucher-search" placeholder="البحث في السندات..." class="form-control">
                    <select id="voucher-type-filter" class="form-control">
                        <option value="">جميع الأنواع</option>
                        <option value="receipt">إيصال</option>
                        <option value="payment">دفع</option>
                    </select>
                </div>
                <div id="vouchers-table"></div>
            </div>
        `;
    }

    private renderReports(container: HTMLElement): void {
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

    private renderSettings(container: HTMLElement): void {
        const state = stateManager.getState();
        
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
                                <option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>داكن</option>
                                <option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>فاتح</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>حجم الخط</label>
                            <select id="font-setting">
                                <option value="14" ${state.settings.font === 14 ? 'selected' : ''}>صغير (14px)</option>
                                <option value="16" ${state.settings.font === 16 ? 'selected' : ''}>متوسط (16px)</option>
                                <option value="18" ${state.settings.font === 18 ? 'selected' : ''}>كبير (18px)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <h3>الأمان</h3>
                        <div class="form-field">
                            <label>كلمة المرور</label>
                            <input type="password" id="password-setting" placeholder="كلمة المرور الحالية">
                        </div>
                        <div class="form-field">
                            <label>كلمة المرور الجديدة</label>
                            <input type="password" id="new-password-setting" placeholder="كلمة المرور الجديدة">
                        </div>
                        <button class="btn btn-primary" id="update-password-btn">تحديث كلمة المرور</button>
                    </div>
                </div>
            </div>
        `;
    }

    private setupEventListeners(): void {
        // Navigation
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const navItem = target.closest('.nav-item') as HTMLElement;
            if (navItem) {
                const view = navItem.dataset.view;
                if (view) {
                    this.navigate(view);
                }
            }
        });

        // Theme selector
        document.getElementById('themeSel')?.addEventListener('change', async (e) => {
            const theme = (e.target as HTMLSelectElement).value;
            await this.updateTheme(theme);
        });

        // Font selector
        document.getElementById('fontSel')?.addEventListener('change', async (e) => {
            const font = parseInt((e.target as HTMLSelectElement).value);
            await this.updateFont(font);
        });

        // Lock button
        document.getElementById('lockBtn')?.addEventListener('click', async () => {
            await this.toggleLock();
        });

        // Undo/Redo
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            if (stateManager.undo()) {
                this.refreshCurrentView();
                showSuccess('تم التراجع');
            }
        });

        document.getElementById('redoBtn')?.addEventListener('click', () => {
            if (stateManager.redo()) {
                this.refreshCurrentView();
                showSuccess('تم التقدم');
            }
        });

        // State change listener
        stateManager.subscribe(() => {
            this.refreshCurrentView();
        });
    }

    private navigate(view: string, param?: string | null): void {
        stateManager.setUIState({ currentView: view, currentParam: param });
        this.renderMainContent();
        this.updateNavigation();
    }

    private updateNavigation(): void {
        const uiState = stateManager.getUIState();
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(`nav-${uiState.currentView}`)?.classList.add('active');
    }

    private refreshCurrentView(): void {
        const uiState = stateManager.getUIState();
        const view = document.querySelector('#view') as HTMLElement;
        if (view) {
            this.renderView(view, uiState.currentView, uiState.currentParam);
        }
        this.updateNavigation();
        this.updateUndoRedoButtons();
    }

    private updateUndoRedoButtons(): void {
        const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
        const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
        
        if (undoBtn) undoBtn.disabled = !stateManager.canUndo();
        if (redoBtn) redoBtn.disabled = !stateManager.canRedo();
    }

    private async updateTheme(theme: 'dark' | 'light'): Promise<void> {
        try {
            await stateManager.updateSettings({ theme });
            document.documentElement.setAttribute('data-theme', theme);
            showSuccess('تم تحديث السمة');
        } catch (error) {
            showError('فشل في تحديث السمة');
        }
    }

    private async updateFont(font: number): Promise<void> {
        try {
            await stateManager.updateSettings({ font });
            document.documentElement.style.fontSize = `${font}px`;
            showSuccess('تم تحديث حجم الخط');
        } catch (error) {
            showError('فشل في تحديث حجم الخط');
        }
    }

    private async toggleLock(): Promise<void> {
        const state = stateManager.getState();
        if (state.locked) {
            const password = prompt('أدخل كلمة المرور لإلغاء القفل:');
            if (password === state.settings.pass) {
                await stateManager.setLock(null);
                showSuccess('تم إلغاء القفل');
            } else {
                showError('كلمة المرور غير صحيحة');
            }
        } else {
            const password = prompt('أدخل كلمة مرور جديدة للقفل:');
            if (password) {
                await stateManager.setLock(password);
                showSuccess('تم تفعيل القفل');
            }
        }
    }

    private applySettings(): void {
        const state = stateManager.getState();
        document.documentElement.setAttribute('data-theme', state.settings.theme);
        document.documentElement.style.fontSize = `${state.settings.font}px`;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = EstateManagerApp.getInstance();
    await app.initialize();
});