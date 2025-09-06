// 🎛️ Interactive Dashboard Widgets for Estate Manager

class DashboardWidgets {
    constructor() {
        this.widgets = new Map();
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.createWidgetContainer();
        this.setupRefreshInterval();
        this.bindEvents();
    }

    createWidgetContainer() {
        // Create dashboard container if it doesn't exist
        if (!document.getElementById('dashboard-widgets')) {
            const container = document.createElement('div');
            container.id = 'dashboard-widgets';
            container.className = 'dashboard-widgets';
            container.innerHTML = `
                <div class="widgets-grid">
                    <div class="widget-row">
                        <div class="widget-col" data-widget="summary-cards"></div>
                        <div class="widget-col" data-widget="recent-activity"></div>
                    </div>
                    <div class="widget-row">
                        <div class="widget-col" data-widget="financial-chart"></div>
                        <div class="widget-col" data-widget="unit-status"></div>
                    </div>
                    <div class="widget-row">
                        <div class="widget-col" data-widget="payment-alerts"></div>
                        <div class="widget-col" data-widget="contract-expiry"></div>
                    </div>
                </div>
            `;
            
            // Add to content area
            const content = document.getElementById('view');
            if (content) {
                content.appendChild(container);
            }
        }
    }

    setupRefreshInterval() {
        // Refresh widgets every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshAllWidgets();
        }, 300000);
    }

    bindEvents() {
        // Theme change handler
        document.addEventListener('themeChanged', () => {
            this.refreshAllWidgets();
        });

        // Data change handlers
        document.addEventListener('dataChanged', (e) => {
            this.refreshWidget(e.detail.type);
        });
    }

    // Summary Cards Widget
    createSummaryCards() {
        const data = this.getSummaryData();
        
        return `
            <div class="widget summary-cards">
                <div class="widget-header">
                    <h3 class="widget-title">ملخص سريع</h3>
                    <button class="btn btn-sm secondary" onclick="dashboard.refreshWidget('summary-cards')">
                        <span class="material-icons">refresh</span>
                    </button>
                </div>
                <div class="widget-content">
                    <div class="summary-grid">
                        <div class="summary-card primary">
                            <div class="summary-icon">
                                <span class="material-icons">people</span>
                            </div>
                            <div class="summary-info">
                                <div class="summary-value">${data.totalCustomers}</div>
                                <div class="summary-label">إجمالي العملاء</div>
                            </div>
                        </div>
                        <div class="summary-card success">
                            <div class="summary-icon">
                                <span class="material-icons">home</span>
                            </div>
                            <div class="summary-info">
                                <div class="summary-value">${data.totalUnits}</div>
                                <div class="summary-label">إجمالي الوحدات</div>
                            </div>
                        </div>
                        <div class="summary-card warning">
                            <div class="summary-icon">
                                <span class="material-icons">description</span>
                            </div>
                            <div class="summary-info">
                                <div class="summary-value">${data.activeContracts}</div>
                                <div class="summary-label">العقود النشطة</div>
                            </div>
                        </div>
                        <div class="summary-card info">
                            <div class="summary-icon">
                                <span class="material-icons">attach_money</span>
                            </div>
                            <div class="summary-info">
                                <div class="summary-value">${this.formatCurrency(data.totalRevenue)}</div>
                                <div class="summary-label">إجمالي الإيرادات</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Recent Activity Widget
    createRecentActivity() {
        const activities = this.getRecentActivities();
        
        return `
            <div class="widget recent-activity">
                <div class="widget-header">
                    <h3 class="widget-title">النشاط الأخير</h3>
                    <button class="btn btn-sm secondary" onclick="dashboard.refreshWidget('recent-activity')">
                        <span class="material-icons">refresh</span>
                    </button>
                </div>
                <div class="widget-content">
                    <div class="activity-list">
                        ${activities.map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon ${activity.type}">
                                    <span class="material-icons">${activity.icon}</span>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">${activity.text}</div>
                                    <div class="activity-time">${activity.time}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Financial Chart Widget
    createFinancialChart() {
        const chartData = this.getFinancialChartData();
        
        return `
            <div class="widget financial-chart">
                <div class="widget-header">
                    <h3 class="widget-title">التحليل المالي</h3>
                    <div class="widget-actions">
                        <select class="form-select" onchange="dashboard.updateChartPeriod(this.value)">
                            <option value="7">آخر 7 أيام</option>
                            <option value="30" selected>آخر 30 يوم</option>
                            <option value="90">آخر 3 أشهر</option>
                            <option value="365">آخر سنة</option>
                        </select>
                        <button class="btn btn-sm secondary" onclick="dashboard.refreshWidget('financial-chart')">
                            <span class="material-icons">refresh</span>
                        </button>
                    </div>
                </div>
                <div class="widget-content">
                    <canvas id="financialChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    }

    // Unit Status Widget
    createUnitStatus() {
        const unitData = this.getUnitStatusData();
        
        return `
            <div class="widget unit-status">
                <div class="widget-header">
                    <h3 class="widget-title">حالة الوحدات</h3>
                    <button class="btn btn-sm secondary" onclick="dashboard.refreshWidget('unit-status')">
                        <span class="material-icons">refresh</span>
                    </button>
                </div>
                <div class="widget-content">
                    <div class="status-chart">
                        <canvas id="unitStatusChart" width="300" height="300"></canvas>
                    </div>
                    <div class="status-legend">
                        <div class="legend-item">
                            <span class="legend-color available"></span>
                            <span class="legend-label">متاحة (${unitData.available})</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color sold"></span>
                            <span class="legend-label">مباعة (${unitData.sold})</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color reserved"></span>
                            <span class="legend-label">محجوزة (${unitData.reserved})</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Payment Alerts Widget
    createPaymentAlerts() {
        const alerts = this.getPaymentAlerts();
        
        return `
            <div class="widget payment-alerts">
                <div class="widget-header">
                    <h3 class="widget-title">تنبيهات المدفوعات</h3>
                    <span class="badge error">${alerts.length}</span>
                </div>
                <div class="widget-content">
                    <div class="alerts-list">
                        ${alerts.length > 0 ? alerts.map(alert => `
                            <div class="alert-item ${alert.priority}">
                                <div class="alert-icon">
                                    <span class="material-icons">${alert.icon}</span>
                                </div>
                                <div class="alert-content">
                                    <div class="alert-title">${alert.title}</div>
                                    <div class="alert-description">${alert.description}</div>
                                    <div class="alert-time">${alert.time}</div>
                                </div>
                                <div class="alert-actions">
                                    <button class="btn btn-sm primary" onclick="dashboard.handleAlert('${alert.id}')">
                                        معالجة
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="no-alerts">
                                <span class="material-icons">check_circle</span>
                                <p>لا توجد تنبيهات</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Contract Expiry Widget
    createContractExpiry() {
        const contracts = this.getExpiringContracts();
        
        return `
            <div class="widget contract-expiry">
                <div class="widget-header">
                    <h3 class="widget-title">العقود المنتهية قريباً</h3>
                    <span class="badge warning">${contracts.length}</span>
                </div>
                <div class="widget-content">
                    <div class="contracts-list">
                        ${contracts.length > 0 ? contracts.map(contract => `
                            <div class="contract-item">
                                <div class="contract-info">
                                    <div class="contract-title">${contract.title}</div>
                                    <div class="contract-details">
                                        <span class="contract-customer">${contract.customer}</span>
                                        <span class="contract-unit">${contract.unit}</span>
                                    </div>
                                </div>
                                <div class="contract-expiry">
                                    <div class="expiry-date">${contract.expiryDate}</div>
                                    <div class="expiry-days ${contract.daysLeft <= 7 ? 'urgent' : ''}">
                                        ${contract.daysLeft} يوم
                                    </div>
                                </div>
                                <div class="contract-actions">
                                    <button class="btn btn-sm primary" onclick="dashboard.renewContract('${contract.id}')">
                                        تجديد
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="no-contracts">
                                <span class="material-icons">event_available</span>
                                <p>لا توجد عقود منتهية قريباً</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Data Methods
    getSummaryData() {
        return {
            totalCustomers: state.customers?.length || 0,
            totalUnits: state.units?.length || 0,
            activeContracts: state.contracts?.filter(c => c.status === 'active').length || 0,
            totalRevenue: this.calculateTotalRevenue()
        };
    }

    getRecentActivities() {
        const activities = [];
        
        // Get recent customers
        if (state.customers && state.customers.length > 0) {
            const recentCustomer = state.customers[state.customers.length - 1];
            activities.push({
                type: 'success',
                icon: 'person_add',
                text: `تم إضافة عميل جديد: ${recentCustomer.name}`,
                time: this.getRelativeTime(recentCustomer.createdAt)
            });
        }
        
        // Get recent contracts
        if (state.contracts && state.contracts.length > 0) {
            const recentContract = state.contracts[state.contracts.length - 1];
            activities.push({
                type: 'info',
                icon: 'description',
                text: `تم إنشاء عقد جديد: ${recentContract.unitCode}`,
                time: this.getRelativeTime(recentContract.createdAt)
            });
        }
        
        // Get recent payments
        if (state.installments && state.installments.length > 0) {
            const recentPayment = state.installments
                .filter(i => i.paid)
                .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0];
            
            if (recentPayment) {
                activities.push({
                    type: 'success',
                    icon: 'payment',
                    text: `تم استلام دفعة: ${this.formatCurrency(recentPayment.amount)}`,
                    time: this.getRelativeTime(recentPayment.paidAt)
                });
            }
        }
        
        return activities.slice(0, 5);
    }

    getFinancialChartData() {
        // Generate sample data for the last 30 days
        const data = [];
        const labels = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ar-EG'));
            data.push(Math.floor(Math.random() * 100000) + 50000);
        }
        
        return { labels, data };
    }

    getUnitStatusData() {
        const units = state.units || [];
        return {
            available: units.filter(u => u.status === 'available').length,
            sold: units.filter(u => u.status === 'sold').length,
            reserved: units.filter(u => u.status === 'reserved').length
        };
    }

    getPaymentAlerts() {
        const alerts = [];
        const today = new Date();
        
        // Check for overdue installments
        if (state.installments) {
            state.installments.forEach(installment => {
                if (!installment.paid && new Date(installment.dueDate) < today) {
                    alerts.push({
                        id: installment.id,
                        priority: 'high',
                        icon: 'warning',
                        title: 'دفعة متأخرة',
                        description: `دفعة متأخرة للوحدة ${installment.unitCode}`,
                        time: this.getRelativeTime(installment.dueDate)
                    });
                }
            });
        }
        
        return alerts.slice(0, 5);
    }

    getExpiringContracts() {
        const contracts = [];
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        if (state.contracts) {
            state.contracts.forEach(contract => {
                const expiryDate = new Date(contract.expiryDate);
                if (expiryDate <= thirtyDaysFromNow && expiryDate >= today) {
                    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    contracts.push({
                        id: contract.id,
                        title: contract.title || 'عقد بيع',
                        customer: contract.customerName || 'غير محدد',
                        unit: contract.unitCode || 'غير محدد',
                        expiryDate: expiryDate.toLocaleDateString('ar-EG'),
                        daysLeft: daysLeft
                    });
                }
            });
        }
        
        return contracts.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);
    }

    // Utility Methods
    calculateTotalRevenue() {
        if (!state.installments) return 0;
        return state.installments
            .filter(i => i.paid)
            .reduce((total, i) => total + (parseFloat(i.amount) || 0), 0);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    }

    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعة`;
        return `${Math.floor(diffInSeconds / 86400)} يوم`;
    }

    // Widget Management
    refreshWidget(widgetType) {
        const container = document.querySelector(`[data-widget="${widgetType}"]`);
        if (!container) return;
        
        let content = '';
        switch (widgetType) {
            case 'summary-cards':
                content = this.createSummaryCards();
                break;
            case 'recent-activity':
                content = this.createRecentActivity();
                break;
            case 'financial-chart':
                content = this.createFinancialChart();
                break;
            case 'unit-status':
                content = this.createUnitStatus();
                break;
            case 'payment-alerts':
                content = this.createPaymentAlerts();
                break;
            case 'contract-expiry':
                content = this.createContractExpiry();
                break;
        }
        
        container.innerHTML = content;
        
        // Initialize charts if needed
        if (widgetType === 'financial-chart') {
            this.initializeFinancialChart();
        } else if (widgetType === 'unit-status') {
            this.initializeUnitStatusChart();
        }
    }

    refreshAllWidgets() {
        const widgetTypes = ['summary-cards', 'recent-activity', 'financial-chart', 'unit-status', 'payment-alerts', 'contract-expiry'];
        widgetTypes.forEach(type => this.refreshWidget(type));
    }

    // Chart Initialization
    initializeFinancialChart() {
        const canvas = document.getElementById('financialChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getFinancialChartData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'الإيرادات اليومية',
                    data: data.data,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('ar-EG').format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    initializeUnitStatusChart() {
        const canvas = document.getElementById('unitStatusChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getUnitStatusData();
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['متاحة', 'مباعة', 'محجوزة'],
                datasets: [{
                    data: [data.available, data.sold, data.reserved],
                    backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Event Handlers
    handleAlert(alertId) {
        console.log('Handling alert:', alertId);
        // Implement alert handling logic
    }

    renewContract(contractId) {
        console.log('Renewing contract:', contractId);
        // Implement contract renewal logic
    }

    updateChartPeriod(period) {
        console.log('Updating chart period:', period);
        this.refreshWidget('financial-chart');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardWidgets();
});

// Add CSS for widgets
const widgetStyles = `
<style>
.dashboard-widgets {
    margin-top: 24px;
}

.widgets-grid {
    display: grid;
    gap: 24px;
}

.widget-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.widget-col {
    min-height: 300px;
}

.widget {
    background: var(--md-surface);
    border-radius: var(--md-border-radius-lg);
    box-shadow: var(--md-elevation-2);
    border: 1px solid var(--md-surface-variant);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--md-spacing-lg);
    border-bottom: 1px solid var(--md-surface-variant);
}

.widget-title {
    font-size: var(--md-font-size-lg);
    font-weight: 600;
    color: var(--md-on-surface);
    margin: 0;
}

.widget-actions {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-sm);
}

.widget-content {
    flex: 1;
    padding: var(--md-spacing-lg);
}

/* Summary Cards */
.summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--md-spacing-md);
}

.summary-card {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-md);
    padding: var(--md-spacing-lg);
    border-radius: var(--md-border-radius-lg);
    color: white;
}

.summary-card.primary { background: linear-gradient(135deg, #1976d2, #42a5f5); }
.summary-card.success { background: linear-gradient(135deg, #388e3c, #66bb6a); }
.summary-card.warning { background: linear-gradient(135deg, #f57c00, #ffb74d); }
.summary-card.info { background: linear-gradient(135deg, #26a69a, #4db6ac); }

.summary-icon {
    font-size: 32px;
    opacity: 0.8;
}

.summary-value {
    font-size: var(--md-font-size-xxl);
    font-weight: 700;
    line-height: 1;
}

.summary-label {
    font-size: var(--md-font-size-sm);
    opacity: 0.9;
}

/* Activity List */
.activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--md-spacing-md);
}

.activity-item {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-md);
    padding: var(--md-spacing-md);
    border-radius: var(--md-border-radius);
    background: var(--md-surface-variant);
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.activity-icon.success { background: var(--md-success); }
.activity-icon.info { background: var(--md-info); }
.activity-icon.warning { background: var(--md-warning); }

.activity-text {
    font-weight: 500;
    color: var(--md-on-surface);
}

.activity-time {
    font-size: var(--md-font-size-xs);
    color: var(--md-on-surface-variant);
}

/* Alerts */
.alerts-list {
    display: flex;
    flex-direction: column;
    gap: var(--md-spacing-md);
}

.alert-item {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-md);
    padding: var(--md-spacing-md);
    border-radius: var(--md-border-radius);
    border-left: 4px solid var(--md-error);
    background: var(--md-surface-variant);
}

.alert-icon {
    color: var(--md-error);
}

.alert-title {
    font-weight: 600;
    color: var(--md-on-surface);
}

.alert-description {
    font-size: var(--md-font-size-sm);
    color: var(--md-on-surface-variant);
}

.alert-time {
    font-size: var(--md-font-size-xs);
    color: var(--md-on-surface-variant);
}

/* Contracts */
.contracts-list {
    display: flex;
    flex-direction: column;
    gap: var(--md-spacing-md);
}

.contract-item {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-md);
    padding: var(--md-spacing-md);
    border-radius: var(--md-border-radius);
    background: var(--md-surface-variant);
}

.contract-title {
    font-weight: 600;
    color: var(--md-on-surface);
}

.contract-details {
    display: flex;
    gap: var(--md-spacing-sm);
    font-size: var(--md-font-size-sm);
    color: var(--md-on-surface-variant);
}

.expiry-days.urgent {
    color: var(--md-error);
    font-weight: 600;
}

/* Badges */
.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: var(--md-font-size-xs);
    font-weight: 600;
    color: white;
}

.badge.error { background: var(--md-error); }
.badge.warning { background: var(--md-warning); }
.badge.success { background: var(--md-success); }

/* No Data States */
.no-alerts,
.no-contracts {
    text-align: center;
    padding: var(--md-spacing-xl);
    color: var(--md-on-surface-variant);
}

.no-alerts .material-icons,
.no-contracts .material-icons {
    font-size: 48px;
    margin-bottom: var(--md-spacing-md);
    opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
    .widget-row {
        grid-template-columns: 1fr;
    }
    
    .summary-grid {
        grid-template-columns: 1fr;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', widgetStyles);