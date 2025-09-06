/* 🚀 تحسينات إضافية للبرنامج */

/* ===== MODERN FEATURES ===== */

// Enhanced keyboard shortcuts
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            const shortcut = this.shortcuts.get(key);
            
            if (shortcut) {
                e.preventDefault();
                shortcut.callback();
            }
        });
    }
    
    getKeyString(e) {
        const keys = [];
        if (e.ctrlKey) keys.push('ctrl');
        if (e.altKey) keys.push('alt');
        if (e.shiftKey) keys.push('shift');
        keys.push(e.key.toLowerCase());
        return keys.join('+');
    }
    
    add(keys, callback, description = '') {
        this.shortcuts.set(keys, { callback, description });
    }
    
    remove(keys) {
        this.shortcuts.delete(keys);
    }
}

// Enhanced tooltips
class TooltipSystem {
    constructor() {
        this.tooltips = new Map();
        this.init();
    }
    
    init() {
        document.addEventListener('mouseover', (e) => {
            const tooltip = e.target.dataset.tooltip;
            if (tooltip) {
                this.show(e.target, tooltip);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.dataset.tooltip) {
                this.hide();
            }
        });
    }
    
    show(element, text) {
        this.hide();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        this.tooltips.set(element, tooltip);
        
        // Add styles if not exists
        if (!document.getElementById('tooltip-styles')) {
            this.addStyles();
        }
    }
    
    hide() {
        this.tooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        this.tooltips.clear();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.id = 'tooltip-styles';
        style.textContent = `
            .tooltip {
                position: absolute;
                background: var(--secondary-800);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                animation: tooltipFadeIn 0.2s ease-out forwards;
                box-shadow: var(--shadow);
            }
            .tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: var(--secondary-800);
            }
            @keyframes tooltipFadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced drag and drop
class DragDropSystem {
    constructor() {
        this.draggedElement = null;
        this.dropZones = new Set();
        this.init();
    }
    
    init() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.draggable) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.draggable) {
                e.target.classList.remove('dragging');
                this.draggedElement = null;
            }
        });
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('[data-drop-zone]');
            if (dropZone) {
                dropZone.classList.add('drag-over');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('[data-drop-zone]');
            if (dropZone) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('[data-drop-zone]');
            if (dropZone && this.draggedElement) {
                this.handleDrop(this.draggedElement, dropZone);
                dropZone.classList.remove('drag-over');
            }
        });
    }
    
    handleDrop(draggedElement, dropZone) {
        const callback = dropZone.dataset.onDrop;
        if (callback && window[callback]) {
            window[callback](draggedElement, dropZone);
        }
    }
    
    addStyles() {
        if (!document.getElementById('drag-drop-styles')) {
            const style = document.createElement('style');
            style.id = 'drag-drop-styles';
            style.textContent = `
                .dragging {
                    opacity: 0.5;
                    transform: rotate(5deg);
                }
                [data-drop-zone] {
                    transition: all 0.2s ease;
                }
                [data-drop-zone].drag-over {
                    background: var(--primary-100);
                    border: 2px dashed var(--primary-500);
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Enhanced context menu
class ContextMenuSystem {
    constructor() {
        this.menus = new Map();
        this.init();
    }
    
    init() {
        document.addEventListener('contextmenu', (e) => {
            const menuId = e.target.dataset.contextMenu;
            if (menuId) {
                e.preventDefault();
                this.show(e, menuId);
            }
        });
        
        document.addEventListener('click', () => {
            this.hide();
        });
    }
    
    show(event, menuId) {
        this.hide();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = this.getMenuHTML(menuId);
        
        document.body.appendChild(menu);
        
        const rect = menu.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        // Adjust position if menu would go off screen
        const adjustedX = x + rect.width > window.innerWidth ? x - rect.width : x;
        const adjustedY = y + rect.height > window.innerHeight ? y - rect.height : y;
        
        menu.style.left = adjustedX + 'px';
        menu.style.top = adjustedY + 'px';
        
        this.menus.set(menuId, menu);
        
        // Add styles if not exists
        if (!document.getElementById('context-menu-styles')) {
            this.addStyles();
        }
    }
    
    hide() {
        this.menus.forEach(menu => {
            if (menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
        });
        this.menus.clear();
    }
    
    getMenuHTML(menuId) {
        const menuItems = {
            'table-row': `
                <div class="menu-item" onclick="editRow()">✏️ تعديل</div>
                <div class="menu-item" onclick="deleteRow()">🗑️ حذف</div>
                <div class="menu-item" onclick="copyRow()">📋 نسخ</div>
            `,
            'card': `
                <div class="menu-item" onclick="editCard()">✏️ تعديل</div>
                <div class="menu-item" onclick="duplicateCard()">📋 نسخ</div>
                <div class="menu-item" onclick="deleteCard()">🗑️ حذف</div>
            `
        };
        
        return menuItems[menuId] || '<div class="menu-item">لا توجد خيارات</div>';
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.id = 'context-menu-styles';
        style.textContent = `
            .context-menu {
                position: fixed;
                background: var(--card);
                border: 1px solid var(--line);
                border-radius: var(--radius);
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                min-width: 150px;
                overflow: hidden;
                backdrop-filter: blur(20px);
            }
            .menu-item {
                padding: 12px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .menu-item:hover {
                background: var(--panel);
            }
            .menu-item:not(:last-child) {
                border-bottom: 1px solid var(--line);
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced progress indicators
class ProgressSystem {
    constructor() {
        this.progressBars = new Map();
        this.init();
    }
    
    init() {
        // Add progress bar styles
        if (!document.getElementById('progress-styles')) {
            this.addStyles();
        }
    }
    
    create(id, options = {}) {
        const progress = document.createElement('div');
        progress.className = 'progress-container';
        progress.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
        
        if (options.container) {
            options.container.appendChild(progress);
        } else {
            document.body.appendChild(progress);
        }
        
        this.progressBars.set(id, {
            element: progress,
            fill: progress.querySelector('.progress-fill'),
            text: progress.querySelector('.progress-text'),
            value: 0
        });
        
        return progress;
    }
    
    update(id, value, text = '') {
        const progress = this.progressBars.get(id);
        if (progress) {
            progress.value = value;
            progress.fill.style.width = value + '%';
            progress.text.textContent = text || value + '%';
            
            if (value >= 100) {
                setTimeout(() => {
                    this.remove(id);
                }, 1000);
            }
        }
    }
    
    remove(id) {
        const progress = this.progressBars.get(id);
        if (progress) {
            if (progress.element.parentNode) {
                progress.element.parentNode.removeChild(progress.element);
            }
            this.progressBars.delete(id);
        }
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.id = 'progress-styles';
        style.textContent = `
            .progress-container {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--card);
                border: 1px solid var(--line);
                border-radius: var(--radius);
                padding: 16px 20px;
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                min-width: 300px;
                backdrop-filter: blur(20px);
            }
            .progress-bar {
                width: 100%;
                height: 8px;
                background: var(--panel);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            .progress-fill {
                height: 100%;
                background: var(--brand);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
            }
            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
            }
            .progress-text {
                text-align: center;
                font-size: 14px;
                font-weight: 500;
                color: var(--ink);
            }
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced form validation
class FormValidation {
    constructor() {
        this.rules = new Map();
        this.init();
    }
    
    init() {
        document.addEventListener('input', (e) => {
            if (e.target.dataset.validate) {
                this.validateField(e.target);
            }
        });
        
        document.addEventListener('submit', (e) => {
            if (e.target.dataset.validate) {
                e.preventDefault();
                this.validateForm(e.target);
            }
        });
    }
    
    addRule(fieldName, rule, message) {
        if (!this.rules.has(fieldName)) {
            this.rules.set(fieldName, []);
        }
        this.rules.get(fieldName).push({ rule, message });
    }
    
    validateField(field) {
        const fieldName = field.name;
        const rules = this.rules.get(fieldName) || [];
        const value = field.value;
        
        for (const { rule, message } of rules) {
            if (!rule(value)) {
                this.showError(field, message);
                return false;
            }
        }
        
        this.hideError(field);
        return true;
    }
    
    validateForm(form) {
        const fields = form.querySelectorAll('[data-validate]');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            form.submit();
        }
        
        return isValid;
    }
    
    showError(field, message) {
        this.hideError(field);
        
        const error = document.createElement('div');
        error.className = 'field-error';
        error.textContent = message;
        
        field.parentNode.appendChild(error);
        field.classList.add('error');
    }
    
    hideError(field) {
        const error = field.parentNode.querySelector('.field-error');
        if (error) {
            error.remove();
        }
        field.classList.remove('error');
    }
    
    addStyles() {
        if (!document.getElementById('validation-styles')) {
            const style = document.createElement('style');
            style.id = 'validation-styles';
            style.textContent = `
                .field-error {
                    color: var(--error);
                    font-size: 12px;
                    margin-top: 4px;
                }
                .error {
                    border-color: var(--error) !important;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    window.keyboardShortcuts = new KeyboardShortcuts();
    window.tooltipSystem = new TooltipSystem();
    window.dragDropSystem = new DragDropSystem();
    window.contextMenuSystem = new ContextMenuSystem();
    window.progressSystem = new ProgressSystem();
    window.formValidation = new FormValidation();
    
    // Add common keyboard shortcuts
    window.keyboardShortcuts.add('ctrl+s', () => {
        showNotification('تم حفظ البيانات', 'success');
    }, 'حفظ البيانات');
    
    window.keyboardShortcuts.add('ctrl+z', () => {
        showNotification('تراجع', 'info');
    }, 'تراجع');
    
    window.keyboardShortcuts.add('ctrl+y', () => {
        showNotification('تقدم', 'info');
    }, 'تقدم');
    
    // Add tooltips to common elements
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes('حفظ')) {
            btn.dataset.tooltip = 'حفظ البيانات (Ctrl+S)';
        } else if (btn.textContent.includes('تراجع')) {
            btn.dataset.tooltip = 'تراجع (Ctrl+Z)';
        } else if (btn.textContent.includes('تقدم')) {
            btn.dataset.tooltip = 'تقدم (Ctrl+Y)';
        }
    });
    
    // Add context menus to tables
    const tableRows = document.querySelectorAll('tr[data-id]');
    tableRows.forEach(row => {
        row.dataset.contextMenu = 'table-row';
    });
    
    // Add drag and drop to cards
    const cards = document.querySelectorAll('.card[data-draggable]');
    cards.forEach(card => {
        card.draggable = true;
    });
    
    // Add progress indicators to forms
    const forms = document.querySelectorAll('form[data-progress]');
    forms.forEach(form => {
        form.addEventListener('submit', () => {
            const progressId = 'form-progress';
            window.progressSystem.create(progressId);
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                window.progressSystem.update(progressId, progress, 'جاري المعالجة...');
                
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 200);
        });
    });
});

/* ===== EXPORT ===== */
window.KeyboardShortcuts = KeyboardShortcuts;
window.TooltipSystem = TooltipSystem;
window.DragDropSystem = DragDropSystem;
window.ContextMenuSystem = ContextMenuSystem;
window.ProgressSystem = ProgressSystem;
window.FormValidation = FormValidation;