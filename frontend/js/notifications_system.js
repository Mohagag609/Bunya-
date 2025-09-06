// 🔔 Real-time Notifications System for Estate Manager

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.settings = {
            enabled: true,
            sound: true,
            desktop: true,
            email: false,
            sms: false,
            checkInterval: 60000, // 1 minute
            reminderInterval: 24 * 60 * 60 * 1000 // 24 hours
        };
        this.checkTimer = null;
        this.reminderTimer = null;
        this.init();
    }

    init() {
        this.loadSettings();
        this.createNotificationContainer();
        this.setupEventListeners();
        this.startPeriodicChecks();
        this.requestNotificationPermission();
    }

    createNotificationContainer() {
        // Create notification container
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.innerHTML = `
            <div class="notification-bell" id="notification-bell">
                <span class="material-icons">notifications</span>
                <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
            </div>
            <div class="notification-dropdown" id="notification-dropdown">
                <div class="notification-header">
                    <h3>الإشعارات</h3>
                    <div class="notification-actions">
                        <button class="btn btn-sm secondary" onclick="notificationSystem.markAllAsRead()">
                            <span class="material-icons">done_all</span>
                        </button>
                        <button class="btn btn-sm secondary" onclick="notificationSystem.clearAll()">
                            <span class="material-icons">clear_all</span>
                        </button>
                    </div>
                </div>
                <div class="notification-list" id="notification-list">
                    <div class="no-notifications">
                        <span class="material-icons">notifications_none</span>
                        <p>لا توجد إشعارات</p>
                    </div>
                </div>
            </div>
        `;

        // Add to header
        const header = document.querySelector('.header');
        if (header) {
            const tools = header.querySelector('.tools');
            if (tools) {
                tools.appendChild(container);
            }
        }
    }

    setupEventListeners() {
        const bell = document.getElementById('notification-bell');
        const dropdown = document.getElementById('notification-dropdown');

        if (bell && dropdown) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-container')) {
                    this.hideDropdown();
                }
            });
        }

        // Listen for data changes
        document.addEventListener('dataChanged', (e) => {
            this.checkForNotifications(e.detail);
        });

        // Listen for payment events
        document.addEventListener('paymentProcessed', (e) => {
            this.createPaymentNotification(e.detail);
        });

        // Listen for contract events
        document.addEventListener('contractCreated', (e) => {
            this.createContractNotification(e.detail);
        });
    }

    startPeriodicChecks() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }

        this.checkTimer = setInterval(() => {
            this.checkOverduePayments();
            this.checkExpiringContracts();
            this.checkLowBalances();
        }, this.settings.checkInterval);

        // Initial check
        this.checkOverduePayments();
        this.checkExpiringContracts();
        this.checkLowBalances();
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.log('Notification permission denied:', error);
            }
        }
    }

    // Notification Types
    checkOverduePayments() {
        if (!state.installments) return;

        const today = new Date();
        const overduePayments = state.installments.filter(installment => {
            return !installment.paid && 
                   new Date(installment.dueDate) < today &&
                   !this.hasNotification('overdue_payment', installment.id);
        });

        overduePayments.forEach(payment => {
            this.createNotification({
                id: `overdue_payment_${payment.id}`,
                type: 'overdue_payment',
                title: 'دفعة متأخرة',
                message: `دفعة متأخرة للوحدة ${payment.unitCode || 'غير محدد'} - المبلغ: ${this.formatCurrency(payment.amount)}`,
                priority: 'high',
                data: payment,
                actions: [
                    {
                        label: 'معالجة الدفعة',
                        action: () => this.processPayment(payment.id)
                    },
                    {
                        label: 'إعادة جدولة',
                        action: () => this.reschedulePayment(payment.id)
                    }
                ]
            });
        });
    }

    checkExpiringContracts() {
        if (!state.contracts) return;

        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringContracts = state.contracts.filter(contract => {
            const expiryDate = new Date(contract.expiryDate);
            return expiryDate <= thirtyDaysFromNow && 
                   expiryDate >= today &&
                   !this.hasNotification('expiring_contract', contract.id);
        });

        expiringContracts.forEach(contract => {
            const daysLeft = Math.ceil((new Date(contract.expiryDate) - today) / (1000 * 60 * 60 * 24));
            this.createNotification({
                id: `expiring_contract_${contract.id}`,
                type: 'expiring_contract',
                title: 'عقد منتهي قريباً',
                message: `عقد ${contract.unitCode || 'غير محدد'} سينتهي خلال ${daysLeft} يوم`,
                priority: daysLeft <= 7 ? 'high' : 'medium',
                data: contract,
                actions: [
                    {
                        label: 'تجديد العقد',
                        action: () => this.renewContract(contract.id)
                    },
                    {
                        label: 'عرض التفاصيل',
                        action: () => this.viewContract(contract.id)
                    }
                ]
            });
        });
    }

    checkLowBalances() {
        if (!state.safes) return;

        const lowBalanceSafes = state.safes.filter(safe => {
            const balance = parseFloat(safe.balance || 0);
            const threshold = parseFloat(safe.lowBalanceThreshold || 10000);
            return balance < threshold && 
                   !this.hasNotification('low_balance', safe.id);
        });

        lowBalanceSafes.forEach(safe => {
            this.createNotification({
                id: `low_balance_${safe.id}`,
                type: 'low_balance',
                title: 'رصيد منخفض',
                message: `الخزينة ${safe.name} لديها رصيد منخفض: ${this.formatCurrency(safe.balance)}`,
                priority: 'medium',
                data: safe,
                actions: [
                    {
                        label: 'عرض الخزينة',
                        action: () => this.viewSafe(safe.id)
                    },
                    {
                        label: 'إضافة رصيد',
                        action: () => this.addBalance(safe.id)
                    }
                ]
            });
        });
    }

    createPaymentNotification(payment) {
        this.createNotification({
            id: `payment_${payment.id}_${Date.now()}`,
            type: 'payment_received',
            title: 'تم استلام دفعة',
            message: `تم استلام دفعة بقيمة ${this.formatCurrency(payment.amount)} للوحدة ${payment.unitCode}`,
            priority: 'low',
            data: payment,
            autoHide: true,
            duration: 5000
        });
    }

    createContractNotification(contract) {
        this.createNotification({
            id: `contract_${contract.id}_${Date.now()}`,
            type: 'contract_created',
            title: 'تم إنشاء عقد جديد',
            message: `تم إنشاء عقد جديد للوحدة ${contract.unitCode}`,
            priority: 'low',
            data: contract,
            autoHide: true,
            duration: 5000
        });
    }

    // Core Notification Methods
    createNotification(options) {
        const notification = {
            id: options.id || `notification_${Date.now()}`,
            type: options.type || 'info',
            title: options.title || 'إشعار',
            message: options.message || '',
            priority: options.priority || 'low',
            data: options.data || null,
            actions: options.actions || [],
            read: false,
            createdAt: new Date().toISOString(),
            autoHide: options.autoHide || false,
            duration: options.duration || 0
        };

        this.notifications.unshift(notification);
        this.updateUI();
        this.showDesktopNotification(notification);
        this.playNotificationSound();

        if (notification.autoHide) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, notification.duration);
        }

        return notification;
    }

    hasNotification(type, dataId) {
        return this.notifications.some(n => 
            n.type === type && 
            n.data && 
            n.data.id === dataId &&
            !n.read
        );
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateUI();
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.updateUI();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateUI();
    }

    clearAll() {
        this.notifications = [];
        this.updateUI();
    }

    // UI Methods
    updateUI() {
        this.updateBadge();
        this.updateDropdown();
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    updateDropdown() {
        const list = document.getElementById('notification-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="no-notifications">
                    <span class="material-icons">notifications_none</span>
                    <p>لا توجد إشعارات</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'} ${notification.priority}" 
                 data-id="${notification.id}">
                <div class="notification-icon">
                    <span class="material-icons">${this.getNotificationIcon(notification.type)}</span>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.getRelativeTime(notification.createdAt)}</div>
                    ${notification.actions.length > 0 ? `
                        <div class="notification-actions">
                            ${notification.actions.map(action => `
                                <button class="btn btn-sm primary" onclick="notificationSystem.handleAction('${notification.id}', '${action.label}')">
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="notification-close" onclick="notificationSystem.removeNotification('${notification.id}')">
                    <span class="material-icons">close</span>
                </div>
            </div>
        `).join('');

        list.innerHTML = notificationsHTML;

        // Add click handlers
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-actions') && 
                    !e.target.closest('.notification-close')) {
                    this.markAsRead(item.dataset.id);
                }
            });
        });
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    hideDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    // Action Handlers
    handleAction(notificationId, actionLabel) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        const action = notification.actions.find(a => a.label === actionLabel);
        if (action && action.action) {
            action.action();
        }

        this.markAsRead(notificationId);
    }

    processPayment(paymentId) {
        console.log('Processing payment:', paymentId);
        // Implement payment processing
        if (typeof nav === 'function') {
            nav('installments');
        }
    }

    reschedulePayment(paymentId) {
        console.log('Rescheduling payment:', paymentId);
        // Implement payment rescheduling
    }

    renewContract(contractId) {
        console.log('Renewing contract:', contractId);
        // Implement contract renewal
        if (typeof nav === 'function') {
            nav('contracts');
        }
    }

    viewContract(contractId) {
        console.log('Viewing contract:', contractId);
        if (typeof nav === 'function') {
            nav('contracts');
        }
    }

    viewSafe(safeId) {
        console.log('Viewing safe:', safeId);
        if (typeof nav === 'function') {
            nav('treasury');
        }
    }

    addBalance(safeId) {
        console.log('Adding balance to safe:', safeId);
        if (typeof nav === 'function') {
            nav('treasury');
        }
    }

    // Desktop Notifications
    showDesktopNotification(notification) {
        if (!this.settings.desktop || !('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.priority === 'high'
            });

            desktopNotification.onclick = () => {
                this.markAsRead(notification.id);
                window.focus();
                desktopNotification.close();
            };

            // Auto close after 5 seconds for low priority notifications
            if (notification.priority === 'low') {
                setTimeout(() => {
                    desktopNotification.close();
                }, 5000);
            }
        }
    }

    // Sound Notifications
    playNotificationSound() {
        if (!this.settings.sound) return;

        // Create audio context for notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    // Utility Methods
    getNotificationIcon(type) {
        const icons = {
            overdue_payment: 'warning',
            expiring_contract: 'schedule',
            low_balance: 'account_balance_wallet',
            payment_received: 'payment',
            contract_created: 'description',
            info: 'info'
        };
        return icons[type] || 'notifications';
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

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    }

    // Settings Management
    loadSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (error) {
                console.log('Could not load notification settings:', error);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    // Public API
    getNotifications() {
        return this.notifications;
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    getSettings() {
        return this.settings;
    }

    // Cleanup
    destroy() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }
        if (this.reminderTimer) {
            clearInterval(this.reminderTimer);
        }
    }
}

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
});

// Add CSS for notifications
const notificationStyles = `
<style>
.notification-container {
    position: relative;
    margin-left: 16px;
}

.notification-bell {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--md-surface);
    border: 1px solid var(--md-surface-variant);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--md-transition);
    box-shadow: var(--md-elevation-1);
}

.notification-bell:hover {
    background: var(--md-surface-variant);
    box-shadow: var(--md-elevation-2);
}

.notification-bell .material-icons {
    color: var(--md-on-surface);
    font-size: 24px;
}

.notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--md-error);
    color: var(--md-on-primary);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    border: 2px solid var(--md-surface);
}

.notification-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    width: 400px;
    max-height: 500px;
    background: var(--md-surface);
    border: 1px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius-lg);
    box-shadow: var(--md-elevation-4);
    z-index: 1000;
    display: none;
    overflow: hidden;
}

.notification-dropdown.show {
    display: block;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--md-surface-variant);
    border-bottom: 1px solid var(--md-surface-variant);
}

.notification-header h3 {
    margin: 0;
    font-size: var(--md-font-size-lg);
    font-weight: 600;
    color: var(--md-on-surface);
}

.notification-actions {
    display: flex;
    gap: 8px;
}

.notification-list {
    max-height: 400px;
    overflow-y: auto;
}

.no-notifications {
    text-align: center;
    padding: 32px 16px;
    color: var(--md-on-surface-variant);
}

.no-notifications .material-icons {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--md-surface-variant);
    cursor: pointer;
    transition: var(--md-transition);
    position: relative;
}

.notification-item:hover {
    background: var(--md-surface-variant);
}

.notification-item.unread {
    background: rgba(25, 118, 210, 0.05);
    border-left: 4px solid var(--md-primary);
}

.notification-item.high {
    border-left: 4px solid var(--md-error);
}

.notification-item.medium {
    border-left: 4px solid var(--md-warning);
}

.notification-item.low {
    border-left: 4px solid var(--md-info);
}

.notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--md-primary);
    color: var(--md-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notification-content {
    flex: 1;
    min-width: 0;
}

.notification-title {
    font-weight: 600;
    color: var(--md-on-surface);
    margin-bottom: 4px;
    line-height: 1.4;
}

.notification-message {
    font-size: var(--md-font-size-sm);
    color: var(--md-on-surface-variant);
    margin-bottom: 8px;
    line-height: 1.4;
}

.notification-time {
    font-size: var(--md-font-size-xs);
    color: var(--md-on-surface-variant);
    margin-bottom: 8px;
}

.notification-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.notification-close {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--md-surface-variant);
    color: var(--md-on-surface-variant);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: var(--md-transition);
}

.notification-item:hover .notification-close {
    opacity: 1;
}

.notification-close:hover {
    background: var(--md-error);
    color: var(--md-on-primary);
}

/* Responsive */
@media (max-width: 768px) {
    .notification-dropdown {
        width: 320px;
        right: -50px;
    }
    
    .notification-item {
        padding: 12px;
    }
    
    .notification-actions {
        flex-direction: column;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);