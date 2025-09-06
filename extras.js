/* 🎯 الوظائف الإضافية والمميزات المتقدمة */

/* ===== KEYBOARD SHORTCUTS ===== */
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
        
        this.setupDefaultShortcuts();
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
    
    setupDefaultShortcuts() {
        // Save data
        this.add('ctrl+s', () => {
            this.saveData();
        }, 'حفظ البيانات');
        
        // Undo
        this.add('ctrl+z', () => {
            this.undo();
        }, 'تراجع');
        
        // Redo
        this.add('ctrl+y', () => {
            this.redo();
        }, 'تقدم');
        
        // Search
        this.add('ctrl+k', () => {
            this.openSearch();
        }, 'فتح البحث');
        
        // New customer
        this.add('ctrl+n', () => {
            this.addCustomer();
        }, 'إضافة عميل جديد');
        
        // New unit
        this.add('ctrl+u', () => {
            this.addUnit();
        }, 'إضافة وحدة جديدة');
        
        // New contract
        this.add('ctrl+c', () => {
            this.addContract();
        }, 'إضافة عقد جديد');
        
        // Export
        this.add('ctrl+e', () => {
            this.exportData();
        }, 'تصدير البيانات');
        
        // Print
        this.add('ctrl+p', () => {
            this.printData();
        }, 'طباعة البيانات');
        
        // Help
        this.add('f1', () => {
            this.showHelp();
        }, 'عرض المساعدة');
        
        // Refresh
        this.add('f5', () => {
            this.refreshData();
        }, 'تحديث البيانات');
    }
    
    saveData() {
        if (window.UIHelpers) {
            window.UIHelpers.showAlert('تم حفظ البيانات', 'success');
        }
    }
    
    undo() {
        if (window.historyIndex > 0) {
            window.historyIndex--;
            const state = window.historyStack[window.historyIndex];
            if (state) {
                window.restoreState(state);
                window.updateUndoRedoButtons();
            }
        }
    }
    
    redo() {
        if (window.historyIndex < window.historyStack.length - 1) {
            window.historyIndex++;
            const state = window.historyStack[window.historyIndex];
            if (state) {
                window.restoreState(state);
                window.updateUndoRedoButtons();
            }
        }
    }
    
    openSearch() {
        if (window.advancedSearch) {
            window.advancedSearch.openSearch();
        }
    }
    
    addCustomer() {
        if (window.quickActions) {
            window.quickActions.addCustomer();
        }
    }
    
    addUnit() {
        if (window.quickActions) {
            window.quickActions.addUnit();
        }
    }
    
    addContract() {
        if (window.quickActions) {
            window.quickActions.addContract();
        }
    }
    
    exportData() {
        if (window.quickActions) {
            window.quickActions.exportData();
        }
    }
    
    printData() {
        window.print();
    }
    
    showHelp() {
        this.showHelpModal();
    }
    
    refreshData() {
        if (window.loadInitialData) {
            window.loadInitialData();
        }
    }
    
    showHelpModal() {
        const helpContent = `
            <div class="help-content">
                <h4>اختصارات لوحة المفاتيح</h4>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + S</span>
                        <span class="shortcut-desc">حفظ البيانات</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + Z</span>
                        <span class="shortcut-desc">تراجع</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + Y</span>
                        <span class="shortcut-desc">تقدم</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + K</span>
                        <span class="shortcut-desc">فتح البحث</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + N</span>
                        <span class="shortcut-desc">إضافة عميل جديد</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + U</span>
                        <span class="shortcut-desc">إضافة وحدة جديدة</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + C</span>
                        <span class="shortcut-desc">إضافة عقد جديد</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + E</span>
                        <span class="shortcut-desc">تصدير البيانات</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + P</span>
                        <span class="shortcut-desc">طباعة البيانات</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">F1</span>
                        <span class="shortcut-desc">عرض المساعدة</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">F5</span>
                        <span class="shortcut-desc">تحديث البيانات</span>
                    </div>
                </div>
            </div>
        `;
        
        if (window.UIHelpers) {
            window.UIHelpers.showModal('help', helpContent, {
                title: 'المساعدة',
                buttons: '<button class="btn" onclick="window.UIHelpers.hideModal(\'help\')">إغلاق</button>'
            });
        }
    }
}

/* ===== CONTEXT MENU ===== */
class ContextMenu {
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
                <div class="menu-item" onclick="this.editRow()">✏️ تعديل</div>
                <div class="menu-item" onclick="this.deleteRow()">🗑️ حذف</div>
                <div class="menu-item" onclick="this.copyRow()">📋 نسخ</div>
                <div class="menu-item" onclick="this.duplicateRow()">📄 تكرار</div>
            `,
            'card': `
                <div class="menu-item" onclick="this.editCard()">✏️ تعديل</div>
                <div class="menu-item" onclick="this.duplicateCard()">📋 نسخ</div>
                <div class="menu-item" onclick="this.deleteCard()">🗑️ حذف</div>
            `,
            'text': `
                <div class="menu-item" onclick="this.copyText()">📋 نسخ</div>
                <div class="menu-item" onclick="this.selectAll()">🔍 تحديد الكل</div>
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

/* ===== DRAG AND DROP ===== */
class DragDrop {
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
        
        // Add styles
        this.addStyles();
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

/* ===== TOOLTIPS ===== */
class Tooltips {
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
        
        // Add styles
        this.addStyles();
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
        if (!document.getElementById('tooltip-styles')) {
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
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize keyboard shortcuts
    window.keyboardShortcuts = new KeyboardShortcuts();
    
    // Initialize context menu
    window.contextMenu = new ContextMenu();
    
    // Initialize drag and drop
    window.dragDrop = new DragDrop();
    
    // Initialize tooltips
    window.tooltips = new Tooltips();
});

/* ===== EXPORT ===== */
window.KeyboardShortcuts = KeyboardShortcuts;
window.ContextMenu = ContextMenu;
window.DragDrop = DragDrop;
window.Tooltips = Tooltips;