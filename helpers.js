/* 🛠️ الوظائف المساعدة والمساعدات الإضافية */

/* ===== DATA HELPERS ===== */
class DataHelpers {
    constructor() {
        this.cache = new Map();
        this.init();
    }
    
    init() {
        // Setup data validation
        this.setupValidation();
    }
    
    setupValidation() {
        // Add validation rules
        this.validationRules = {
            required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^[\+]?[0-9\s\-\(\)]{10,}$/.test(value),
            number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
            positive: (value) => parseFloat(value) > 0,
            minLength: (value, min) => value.toString().length >= min,
            maxLength: (value, max) => value.toString().length <= max
        };
    }
    
    validate(data, rules) {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const fieldRules = rules[field];
            const value = data[field];
            
            fieldRules.forEach(rule => {
                if (typeof rule === 'string') {
                    if (!this.validationRules[rule](value)) {
                        errors[field] = errors[field] || [];
                        errors[field].push(`${field} ${rule} مطلوب`);
                    }
                } else if (typeof rule === 'object') {
                    const ruleName = rule.rule;
                    const ruleValue = rule.value;
                    const message = rule.message || `${field} ${ruleName} مطلوب`;
                    
                    if (!this.validationRules[ruleName](value, ruleValue)) {
                        errors[field] = errors[field] || [];
                        errors[field].push(message);
                    }
                }
            });
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    sanitize(data) {
        const sanitized = {};
        
        Object.keys(data).forEach(key => {
            let value = data[key];
            
            if (typeof value === 'string') {
                value = value.trim();
                value = value.replace(/[<>]/g, '');
            }
            
            sanitized[key] = value;
        });
        
        return sanitized;
    }
    
    format(data, formatRules) {
        const formatted = { ...data };
        
        Object.keys(formatRules).forEach(key => {
            const rule = formatRules[key];
            const value = formatted[key];
            
            if (rule === 'currency') {
                formatted[key] = this.formatCurrency(value);
            } else if (rule === 'date') {
                formatted[key] = this.formatDate(value);
            } else if (rule === 'phone') {
                formatted[key] = this.formatPhone(value);
            } else if (rule === 'uppercase') {
                formatted[key] = value.toString().toUpperCase();
            } else if (rule === 'lowercase') {
                formatted[key] = value.toString().toLowerCase();
            }
        });
        
        return formatted;
    }
    
    formatCurrency(amount) {
        if (typeof amount !== 'number') return '0 ريال';
        return amount.toLocaleString('ar-SA') + ' ريال';
    }
    
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('ar-SA');
    }
    
    formatPhone(phone) {
        if (!phone) return '';
        return phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
}

/* ===== UI HELPERS ===== */
class UIHelpers {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupTooltips();
        this.setupModals();
        this.setupAlerts();
    }
    
    setupTooltips() {
        // Add tooltip functionality
        document.addEventListener('mouseover', (e) => {
            if (e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.dataset.tooltip) {
                this.hideTooltip();
            }
        });
    }
    
    showTooltip(element, text) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        this.currentTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    setupModals() {
        // Add modal functionality
        this.modals = new Map();
    }
    
    showModal(id, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.dataset.modalId = id;
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${options.title || 'Modal'}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${options.buttons || ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modals.set(id, modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideModal(id);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal(id);
            }
        });
        
        // Add styles if not exists
        if (!document.getElementById('modal-styles')) {
            this.addModalStyles();
        }
        
        return modal;
    }
    
    hideModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.remove();
            this.modals.delete(id);
        }
    }
    
    addModalStyles() {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            .modal-container {
                background: var(--card);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-lg);
                border-bottom: 1px solid var(--line);
            }
            .modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--muted);
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: var(--transition);
            }
            .modal-close:hover {
                background: var(--line);
                color: var(--ink);
            }
            .modal-body {
                padding: var(--space-lg);
                max-height: 60vh;
                overflow-y: auto;
            }
            .modal-footer {
                padding: var(--space-lg);
                border-top: 1px solid var(--line);
                display: flex;
                gap: var(--space-md);
                justify-content: flex-end;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupAlerts() {
        // Add alert functionality
        this.alerts = [];
    }
    
    showAlert(message, type = 'info', duration = 5000) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${this.getAlertIcon(type)}</span>
                <span class="alert-message">${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        this.alerts.push(alert);
        
        // Add styles if not exists
        if (!document.getElementById('alert-styles')) {
            this.addAlertStyles();
        }
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeAlert(alert);
        }, duration);
        
        // Close button functionality
        alert.querySelector('.alert-close').addEventListener('click', () => {
            this.removeAlert(alert);
        });
        
        return alert;
    }
    
    removeAlert(alert) {
        if (alert && alert.parentNode) {
            alert.remove();
            const index = this.alerts.indexOf(alert);
            if (index > -1) {
                this.alerts.splice(index, 1);
            }
        }
    }
    
    getAlertIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }
    
    addAlertStyles() {
        const style = document.createElement('style');
        style.id = 'alert-styles';
        style.textContent = `
            .alert {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--card);
                border: 1px solid var(--line);
                border-radius: var(--radius);
                box-shadow: var(--shadow-lg);
                z-index: 10001;
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
                backdrop-filter: blur(20px);
            }
            .alert-content {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-md);
            }
            .alert-icon {
                font-size: 20px;
            }
            .alert-message {
                flex: 1;
                font-weight: 500;
            }
            .alert-close {
                background: none;
                border: none;
                color: var(--muted);
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: var(--transition);
            }
            .alert-close:hover {
                background: var(--line);
                color: var(--ink);
            }
            .alert-info { border-left: 4px solid var(--info); }
            .alert-success { border-left: 4px solid var(--success); }
            .alert-warning { border-left: 4px solid var(--warning); }
            .alert-error { border-left: 4px solid var(--error); }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ===== FORM HELPERS ===== */
class FormHelpers {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupFormValidation();
        this.setupFormSubmission();
    }
    
    setupFormValidation() {
        // Add form validation
        document.addEventListener('input', (e) => {
            if (e.target.dataset.validate) {
                this.validateField(e.target);
            }
        });
    }
    
    validateField(field) {
        const rules = field.dataset.validate.split('|');
        const value = field.value;
        const errors = [];
        
        rules.forEach(rule => {
            if (rule === 'required' && !value.trim()) {
                errors.push('هذا الحقل مطلوب');
            } else if (rule === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push('البريد الإلكتروني غير صحيح');
            } else if (rule === 'phone' && value && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(value)) {
                errors.push('رقم الهاتف غير صحيح');
            } else if (rule.startsWith('min:') && value.length < parseInt(rule.split(':')[1])) {
                errors.push(`الحد الأدنى ${rule.split(':')[1]} حرف`);
            } else if (rule.startsWith('max:') && value.length > parseInt(rule.split(':')[1])) {
                errors.push(`الحد الأقصى ${rule.split(':')[1]} حرف`);
            }
        });
        
        this.showFieldErrors(field, errors);
        return errors.length === 0;
    }
    
    showFieldErrors(field, errors) {
        this.hideFieldErrors(field);
        
        if (errors.length > 0) {
            field.classList.add('error');
            
            const errorContainer = document.createElement('div');
            errorContainer.className = 'field-errors';
            errorContainer.innerHTML = errors.map(error => `
                <div class="field-error">${error}</div>
            `).join('');
            
            field.parentNode.appendChild(errorContainer);
        } else {
            field.classList.remove('error');
        }
    }
    
    hideFieldErrors(field) {
        const errorContainer = field.parentNode.querySelector('.field-errors');
        if (errorContainer) {
            errorContainer.remove();
        }
    }
    
    setupFormSubmission() {
        // Add form submission handling
        document.addEventListener('submit', (e) => {
            if (e.target.dataset.validate) {
                e.preventDefault();
                this.handleFormSubmission(e.target);
            }
        });
    }
    
    handleFormSubmission(form) {
        const fields = form.querySelectorAll('[data-validate]');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            this.submitForm(form);
        }
    }
    
    submitForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Process form data
        console.log('Form submitted:', data);
        
        // Show success message
        if (window.UIHelpers) {
            window.UIHelpers.showAlert('تم حفظ البيانات بنجاح', 'success');
        }
    }
}

/* ===== TABLE HELPERS ===== */
class TableHelpers {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupTableSorting();
        this.setupTableFiltering();
        this.setupTablePagination();
    }
    
    setupTableSorting() {
        // Add table sorting
        document.addEventListener('click', (e) => {
            if (e.target.matches('th[data-sort]')) {
                this.sortTable(e.target);
            }
        });
    }
    
    sortTable(header) {
        const table = header.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const column = header.dataset.sort;
        const direction = header.dataset.direction || 'asc';
        
        rows.sort((a, b) => {
            const aVal = a.querySelector(`[data-${column}]`)?.textContent || '';
            const bVal = b.querySelector(`[data-${column}]`)?.textContent || '';
            
            if (direction === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
        
        // Update table
        rows.forEach(row => tbody.appendChild(row));
        
        // Update header direction
        header.dataset.direction = direction === 'asc' ? 'desc' : 'asc';
        
        // Update header icon
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.textContent = direction === 'asc' ? '↑' : '↓';
        }
    }
    
    setupTableFiltering() {
        // Add table filtering
        document.addEventListener('input', (e) => {
            if (e.target.matches('.table-filter')) {
                this.filterTable(e.target);
            }
        });
    }
    
    filterTable(filterInput) {
        const table = filterInput.closest('.table-container').querySelector('table');
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        const filterValue = filterInput.value.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(filterValue);
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    setupTablePagination() {
        // Add table pagination
        // This would be implemented based on your specific needs
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize data helpers
    window.dataHelpers = new DataHelpers();
    
    // Initialize UI helpers
    window.UIHelpers = new UIHelpers();
    
    // Initialize form helpers
    window.formHelpers = new FormHelpers();
    
    // Initialize table helpers
    window.tableHelpers = new TableHelpers();
});

/* ===== EXPORT ===== */
window.DataHelpers = DataHelpers;
window.UIHelpers = UIHelpers;
window.FormHelpers = FormHelpers;
window.TableHelpers = TableHelpers;