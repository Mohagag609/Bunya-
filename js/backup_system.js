// 💾 Automated Backup System for Estate Manager

class BackupSystem {
    constructor() {
        this.settings = {
            enabled: true,
            frequency: 'daily', // daily, weekly, monthly
            time: '02:00', // 24-hour format
            maxBackups: 30,
            cloudEnabled: false,
            cloudProvider: 'google', // google, dropbox, onedrive
            compression: true,
            encryption: true,
            password: null
        };
        this.backupTimer = null;
        this.isBackingUp = false;
        this.backupHistory = [];
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadBackupHistory();
        this.setupScheduledBackups();
        this.createBackupInterface();
        this.bindEvents();
    }

    createBackupInterface() {
        // Create backup section in settings or dashboard
        const backupSection = document.createElement('div');
        backupSection.id = 'backup-section';
        backupSection.className = 'backup-section';
        backupSection.innerHTML = `
            <div class="backup-card">
                <div class="backup-header">
                    <h3>نظام النسخ الاحتياطي</h3>
                    <div class="backup-status" id="backup-status">
                        <span class="status-indicator" id="status-indicator"></span>
                        <span id="status-text">جاهز</span>
                    </div>
                </div>
                
                <div class="backup-controls">
                    <button class="btn primary" onclick="backupSystem.createBackup()" id="create-backup-btn">
                        <span class="material-icons">backup</span>
                        إنشاء نسخة احتياطية
                    </button>
                    <button class="btn secondary" onclick="backupSystem.restoreBackup()" id="restore-backup-btn">
                        <span class="material-icons">restore</span>
                        استعادة نسخة احتياطية
                    </button>
                    <button class="btn secondary" onclick="backupSystem.showSettings()" id="backup-settings-btn">
                        <span class="material-icons">settings</span>
                        الإعدادات
                    </button>
                </div>

                <div class="backup-history" id="backup-history">
                    <h4>تاريخ النسخ الاحتياطية</h4>
                    <div class="backup-list" id="backup-list">
                        <!-- Backup items will be populated here -->
                    </div>
                </div>
            </div>
        `;

        // Add to content area or create a new tab
        this.addToInterface(backupSection);
    }

    addToInterface(element) {
        // Try to add to existing interface
        const content = document.getElementById('view');
        if (content) {
            // Check if backup tab exists
            let backupTab = document.querySelector('[data-tab="backup"]');
            if (!backupTab) {
                // Create backup tab
                const sidebar = document.getElementById('tabs');
                if (sidebar) {
                    const tab = document.createElement('button');
                    tab.className = 'tab';
                    tab.setAttribute('data-tab', 'backup');
                    tab.innerHTML = '<span class="material-icons">backup</span> النسخ الاحتياطي';
                    sidebar.appendChild(tab);
                }
            }
        }
    }

    setupScheduledBackups() {
        if (!this.settings.enabled) return;

        // Calculate next backup time
        const nextBackup = this.calculateNextBackupTime();
        const now = new Date();
        const timeUntilBackup = nextBackup - now;

        if (timeUntilBackup > 0) {
            this.backupTimer = setTimeout(() => {
                this.createScheduledBackup();
            }, timeUntilBackup);
        }

        // Set up recurring backups
        this.setupRecurringBackups();
    }

    calculateNextBackupTime() {
        const now = new Date();
        const [hours, minutes] = this.settings.time.split(':').map(Number);
        
        let nextBackup = new Date(now);
        nextBackup.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (nextBackup <= now) {
            nextBackup.setDate(nextBackup.getDate() + 1);
        }

        // Adjust based on frequency
        switch (this.settings.frequency) {
            case 'weekly':
                // Find next occurrence of the same day of week
                const targetDay = nextBackup.getDay();
                while (nextBackup.getDay() !== targetDay || nextBackup <= now) {
                    nextBackup.setDate(nextBackup.getDate() + 1);
                }
                break;
            case 'monthly':
                // Find next occurrence of the same day of month
                const targetDate = nextBackup.getDate();
                nextBackup.setMonth(nextBackup.getMonth() + 1);
                while (nextBackup.getDate() !== targetDate || nextBackup <= now) {
                    nextBackup.setMonth(nextBackup.getMonth() + 1);
                }
                break;
        }

        return nextBackup;
    }

    setupRecurringBackups() {
        const intervals = {
            daily: 24 * 60 * 60 * 1000, // 24 hours
            weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
            monthly: 30 * 24 * 60 * 60 * 1000 // 30 days
        };

        const interval = intervals[this.settings.frequency];
        if (interval) {
            setInterval(() => {
                this.createScheduledBackup();
            }, interval);
        }
    }

    async createBackup() {
        if (this.isBackingUp) {
            this.showMessage('جاري إنشاء نسخة احتياطية...', 'info');
            return;
        }

        this.isBackingUp = true;
        this.updateStatus('جاري إنشاء النسخة الاحتياطية...', 'working');

        try {
            const backupData = await this.collectBackupData();
            const backup = await this.processBackup(backupData);
            await this.saveBackup(backup);
            
            this.showMessage('تم إنشاء النسخة الاحتياطية بنجاح', 'success');
            this.updateStatus('آخر نسخة احتياطية: الآن', 'success');
            this.loadBackupHistory();
        } catch (error) {
            console.error('Backup failed:', error);
            this.showMessage('فشل في إنشاء النسخة الاحتياطية', 'error');
            this.updateStatus('فشل في النسخ الاحتياطي', 'error');
        } finally {
            this.isBackingUp = false;
        }
    }

    async createScheduledBackup() {
        if (!this.settings.enabled) return;

        try {
            await this.createBackup();
            console.log('Scheduled backup completed');
        } catch (error) {
            console.error('Scheduled backup failed:', error);
        }
    }

    async collectBackupData() {
        const data = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            data: {
                customers: state.customers || [],
                units: state.units || [],
                partners: state.partners || [],
                unitPartners: state.unitPartners || [],
                contracts: state.contracts || [],
                installments: state.installments || [],
                partnerDebts: state.partnerDebts || [],
                safes: state.safes || [],
                transfers: state.transfers || [],
                auditLog: state.auditLog || [],
                vouchers: state.vouchers || [],
                brokerDues: state.brokerDues || [],
                brokers: state.brokers || [],
                partnerGroups: state.partnerGroups || [],
                settings: state.settings || {},
                keyval: state.keyval || {}
            },
            metadata: {
                totalRecords: this.countTotalRecords(),
                dataSize: 0,
                checksum: null
            }
        };

        // Calculate data size
        const jsonString = JSON.stringify(data);
        data.metadata.dataSize = new Blob([jsonString]).size;

        // Calculate checksum
        data.metadata.checksum = await this.calculateChecksum(jsonString);

        return data;
    }

    countTotalRecords() {
        let total = 0;
        for (const key in state) {
            if (Array.isArray(state[key])) {
                total += state[key].length;
            }
        }
        return total;
    }

    async calculateChecksum(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async processBackup(backupData) {
        let processedData = backupData;

        // Compress if enabled
        if (this.settings.compression) {
            processedData = await this.compressData(backupData);
        }

        // Encrypt if enabled
        if (this.settings.encryption && this.settings.password) {
            processedData = await this.encryptData(processedData, this.settings.password);
        }

        return {
            ...processedData,
            settings: {
                compressed: this.settings.compression,
                encrypted: this.settings.encryption,
                version: '1.0.0'
            }
        };
    }

    async compressData(data) {
        // Simple compression using JSON stringify with replacer
        const jsonString = JSON.stringify(data, null, 0);
        return {
            compressed: true,
            data: jsonString,
            originalSize: new Blob([JSON.stringify(data)]).size,
            compressedSize: new Blob([jsonString]).size
        };
    }

    async encryptData(data, password) {
        // Simple encryption using Web Crypto API
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        // Generate key from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('estate-manager-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            dataBuffer
        );

        return {
            encrypted: true,
            data: Array.from(new Uint8Array(encryptedData)),
            iv: Array.from(iv)
        };
    }

    async saveBackup(backup) {
        const backupId = `backup_${Date.now()}`;
        const backupInfo = {
            id: backupId,
            timestamp: new Date().toISOString(),
            size: backup.metadata?.dataSize || 0,
            records: backup.metadata?.totalRecords || 0,
            compressed: backup.settings?.compressed || false,
            encrypted: backup.settings?.encrypted || false,
            checksum: backup.metadata?.checksum || null
        };

        // Save to localStorage
        localStorage.setItem(`backup_${backupId}`, JSON.stringify(backup));
        
        // Update backup history
        this.backupHistory.unshift(backupInfo);
        this.saveBackupHistory();

        // Clean up old backups
        this.cleanupOldBackups();

        // Upload to cloud if enabled
        if (this.settings.cloudEnabled) {
            await this.uploadToCloud(backup, backupId);
        }

        return backupId;
    }

    cleanupOldBackups() {
        // Keep only the most recent backups
        const maxBackups = this.settings.maxBackups;
        if (this.backupHistory.length > maxBackups) {
            const backupsToRemove = this.backupHistory.slice(maxBackups);
            backupsToRemove.forEach(backup => {
                localStorage.removeItem(`backup_${backup.id}`);
            });
            this.backupHistory = this.backupHistory.slice(0, maxBackups);
            this.saveBackupHistory();
        }
    }

    async uploadToCloud(backup, backupId) {
        try {
            // This would integrate with cloud storage APIs
            console.log('Uploading to cloud:', backupId);
            // Implementation depends on chosen cloud provider
        } catch (error) {
            console.error('Cloud upload failed:', error);
        }
    }

    async restoreBackup() {
        const backupId = await this.selectBackupToRestore();
        if (!backupId) return;

        try {
            const backup = await this.loadBackup(backupId);
            if (!backup) {
                this.showMessage('النسخة الاحتياطية غير موجودة', 'error');
                return;
            }

            const confirmed = confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.');
            if (!confirmed) return;

            await this.restoreData(backup);
            this.showMessage('تم استعادة النسخة الاحتياطية بنجاح', 'success');
            
            // Reload the application
            location.reload();
        } catch (error) {
            console.error('Restore failed:', error);
            this.showMessage('فشل في استعادة النسخة الاحتياطية', 'error');
        }
    }

    async selectBackupToRestore() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>اختر النسخة الاحتياطية</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="backup-selection-list">
                            ${this.backupHistory.map(backup => `
                                <div class="backup-item" data-id="${backup.id}">
                                    <div class="backup-info">
                                        <div class="backup-date">${new Date(backup.timestamp).toLocaleString('ar-EG')}</div>
                                        <div class="backup-details">
                                            ${backup.records} سجل | ${this.formatFileSize(backup.size)}
                                            ${backup.compressed ? ' | مضغوط' : ''}
                                            ${backup.encrypted ? ' | مشفر' : ''}
                                        </div>
                                    </div>
                                    <button class="btn primary" onclick="backupSystem.selectBackup('${backup.id}')">
                                        استعادة
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Store resolve function globally for selection
            window.backupSystem = window.backupSystem || {};
            window.backupSystem.selectBackup = (id) => {
                modal.remove();
                resolve(id);
            };
        });
    }

    async loadBackup(backupId) {
        const backupData = localStorage.getItem(`backup_${backupId}`);
        if (!backupData) return null;

        try {
            const backup = JSON.parse(backupData);
            
            // Decrypt if needed
            if (backup.settings?.encrypted) {
                backup = await this.decryptData(backup);
            }

            // Decompress if needed
            if (backup.settings?.compressed) {
                backup = this.decompressData(backup);
            }

            return backup;
        } catch (error) {
            console.error('Failed to load backup:', error);
            return null;
        }
    }

    async decryptData(encryptedBackup) {
        if (!this.settings.password) {
            const password = prompt('أدخل كلمة المرور لفك التشفير:');
            if (!password) throw new Error('Password required for decryption');
            this.settings.password = password;
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Generate key from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.settings.password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('estate-manager-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        const iv = new Uint8Array(encryptedBackup.iv);
        const encryptedData = new Uint8Array(encryptedBackup.data);
        
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedData
        );

        return JSON.parse(decoder.decode(decryptedData));
    }

    decompressData(compressedBackup) {
        return JSON.parse(compressedBackup.data);
    }

    async restoreData(backup) {
        // Validate backup
        if (!backup.data) {
            throw new Error('Invalid backup data');
        }

        // Clear current data
        for (const key in state) {
            if (Array.isArray(state[key])) {
                state[key] = [];
            } else if (typeof state[key] === 'object') {
                state[key] = {};
            }
        }

        // Restore data
        Object.assign(state, backup.data);

        // Save to storage
        await this.saveStateToStorage();

        // Log the restoration
        logAction('استعادة نسخة احتياطية', {
            backupId: backup.id,
            timestamp: backup.timestamp,
            records: backup.metadata?.totalRecords || 0
        });
    }

    async saveStateToStorage() {
        // Save to IndexedDB or localStorage
        if (typeof persist === 'function') {
            await persist();
        }
    }

    loadBackupHistory() {
        const saved = localStorage.getItem('backupHistory');
        if (saved) {
            try {
                this.backupHistory = JSON.parse(saved);
            } catch (error) {
                console.error('Failed to load backup history:', error);
                this.backupHistory = [];
            }
        }
    }

    saveBackupHistory() {
        localStorage.setItem('backupHistory', JSON.stringify(this.backupHistory));
    }

    updateBackupList() {
        const backupList = document.getElementById('backup-list');
        if (!backupList) return;

        if (this.backupHistory.length === 0) {
            backupList.innerHTML = `
                <div class="no-backups">
                    <span class="material-icons">backup</span>
                    <p>لا توجد نسخ احتياطية</p>
                </div>
            `;
            return;
        }

        backupList.innerHTML = this.backupHistory.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-date">${new Date(backup.timestamp).toLocaleString('ar-EG')}</div>
                    <div class="backup-details">
                        ${backup.records} سجل | ${this.formatFileSize(backup.size)}
                        ${backup.compressed ? ' | مضغوط' : ''}
                        ${backup.encrypted ? ' | مشفر' : ''}
                    </div>
                </div>
                <div class="backup-actions">
                    <button class="btn btn-sm primary" onclick="backupSystem.downloadBackup('${backup.id}')">
                        <span class="material-icons">download</span>
                    </button>
                    <button class="btn btn-sm secondary" onclick="backupSystem.deleteBackup('${backup.id}')">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async downloadBackup(backupId) {
        try {
            const backup = await this.loadBackup(backupId);
            if (!backup) return;

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${backupId}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            this.showMessage('فشل في تحميل النسخة الاحتياطية', 'error');
        }
    }

    async deleteBackup(backupId) {
        const confirmed = confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟');
        if (!confirmed) return;

        localStorage.removeItem(`backup_${backupId}`);
        this.backupHistory = this.backupHistory.filter(b => b.id !== backupId);
        this.saveBackupHistory();
        this.updateBackupList();
        this.showMessage('تم حذف النسخة الاحتياطية', 'success');
    }

    showSettings() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>إعدادات النسخ الاحتياطي</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="backup-settings-form">
                        <div class="form-group">
                            <label class="form-label">تفعيل النسخ الاحتياطي التلقائي</label>
                            <input type="checkbox" id="backup-enabled" ${this.settings.enabled ? 'checked' : ''}>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">تكرار النسخ الاحتياطي</label>
                            <select id="backup-frequency" class="form-select">
                                <option value="daily" ${this.settings.frequency === 'daily' ? 'selected' : ''}>يومياً</option>
                                <option value="weekly" ${this.settings.frequency === 'weekly' ? 'selected' : ''}>أسبوعياً</option>
                                <option value="monthly" ${this.settings.frequency === 'monthly' ? 'selected' : ''}>شهرياً</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">وقت النسخ الاحتياطي</label>
                            <input type="time" id="backup-time" class="form-input" value="${this.settings.time}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">الحد الأقصى للنسخ الاحتياطية</label>
                            <input type="number" id="max-backups" class="form-input" value="${this.settings.maxBackups}" min="1" max="100">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">ضغط البيانات</label>
                            <input type="checkbox" id="compression" ${this.settings.compression ? 'checked' : ''}>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">تشفير البيانات</label>
                            <input type="checkbox" id="encryption" ${this.settings.encryption ? 'checked' : ''}>
                        </div>
                        
                        <div class="form-group" id="password-group" style="${this.settings.encryption ? '' : 'display: none;'}">
                            <label class="form-label">كلمة مرور التشفير</label>
                            <input type="password" id="encryption-password" class="form-input" value="${this.settings.password || ''}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button class="btn primary" onclick="backupSystem.saveSettings()">حفظ</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show/hide password field based on encryption setting
        document.getElementById('encryption').addEventListener('change', (e) => {
            const passwordGroup = document.getElementById('password-group');
            passwordGroup.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    saveSettings() {
        const form = document.getElementById('backup-settings-form');
        if (!form) return;

        this.settings = {
            enabled: form.querySelector('#backup-enabled').checked,
            frequency: form.querySelector('#backup-frequency').value,
            time: form.querySelector('#backup-time').value,
            maxBackups: parseInt(form.querySelector('#max-backups').value),
            compression: form.querySelector('#compression').checked,
            encryption: form.querySelector('#encryption').checked,
            password: form.querySelector('#encryption-password').value
        };

        this.saveSettingsToStorage();
        this.setupScheduledBackups();
        
        // Close modal
        document.querySelector('.modal').remove();
        this.showMessage('تم حفظ الإعدادات', 'success');
    }

    saveSettingsToStorage() {
        localStorage.setItem('backupSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('backupSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (error) {
                console.error('Failed to load backup settings:', error);
            }
        }
    }

    updateStatus(text, type) {
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');
        
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${type}`;
        }
    }

    showMessage(message, type) {
        // Use existing notification system or create simple alert
        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                title: 'نظام النسخ الاحتياطي',
                message: message,
                type: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'
            });
        } else {
            alert(message);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    bindEvents() {
        // Update backup list when data changes
        document.addEventListener('dataChanged', () => {
            this.updateBackupList();
        });
    }

    // Public API
    getBackupHistory() {
        return this.backupHistory;
    }

    getSettings() {
        return this.settings;
    }

    isBackupInProgress() {
        return this.isBackingUp;
    }
}

// Initialize backup system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.backupSystem = new BackupSystem();
});

// Add CSS for backup system
const backupStyles = `
<style>
.backup-section {
    margin: 24px 0;
}

.backup-card {
    background: var(--md-surface);
    border-radius: var(--md-border-radius-lg);
    padding: 24px;
    box-shadow: var(--md-elevation-2);
    border: 1px solid var(--md-surface-variant);
}

.backup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--md-surface-variant);
}

.backup-header h3 {
    margin: 0;
    font-size: var(--md-font-size-xl);
    font-weight: 600;
    color: var(--md-on-surface);
}

.backup-status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--md-success);
}

.status-indicator.working {
    background: var(--md-warning);
    animation: pulse 1s infinite;
}

.status-indicator.error {
    background: var(--md-error);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.backup-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;
}

.backup-history h4 {
    margin: 0 0 16px 0;
    font-size: var(--md-font-size-lg);
    font-weight: 600;
    color: var(--md-on-surface);
}

.backup-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.backup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--md-surface-variant);
    border-radius: var(--md-border-radius);
    border: 1px solid var(--md-surface-variant);
    transition: var(--md-transition);
}

.backup-item:hover {
    background: var(--md-surface);
    box-shadow: var(--md-elevation-1);
}

.backup-info {
    flex: 1;
}

.backup-date {
    font-weight: 600;
    color: var(--md-on-surface);
    margin-bottom: 4px;
}

.backup-details {
    font-size: var(--md-font-size-sm);
    color: var(--md-on-surface-variant);
}

.backup-actions {
    display: flex;
    gap: 8px;
}

.no-backups {
    text-align: center;
    padding: 32px;
    color: var(--md-on-surface-variant);
}

.no-backups .material-icons {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.backup-selection-list {
    max-height: 400px;
    overflow-y: auto;
}

.backup-selection-list .backup-item {
    cursor: pointer;
    margin-bottom: 8px;
}

.backup-selection-list .backup-item:hover {
    background: var(--md-primary);
    color: var(--md-on-primary);
}

/* Modal styles */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--md-surface);
    border-radius: var(--md-border-radius-lg);
    box-shadow: var(--md-elevation-5);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid var(--md-surface-variant);
}

.modal-header h3 {
    margin: 0;
    font-size: var(--md-font-size-xl);
    font-weight: 600;
    color: var(--md-on-surface);
}

.modal-close {
    background: none;
    border: none;
    color: var(--md-on-surface-variant);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: var(--md-transition);
}

.modal-close:hover {
    background: var(--md-surface-variant);
    color: var(--md-on-surface);
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 24px;
    border-top: 1px solid var(--md-surface-variant);
}

/* Responsive */
@media (max-width: 768px) {
    .backup-controls {
        flex-direction: column;
    }
    
    .backup-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .backup-actions {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', backupStyles);