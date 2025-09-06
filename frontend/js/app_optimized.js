/* Optimized JavaScript for better performance */

// Debounce function for better performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Optimized DOM manipulation
const DOM = {
    // Cache frequently used elements
    cache: new Map(),
    
    get(selector) {
        if (this.cache.has(selector)) {
            return this.cache.get(selector);
        }
        const element = document.querySelector(selector);
        if (element) {
            this.cache.set(selector, element);
        }
        return element;
    },
    
    getAll(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Batch DOM updates
    batchUpdate(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    }
};

// Optimized state management
const State = {
    data: {},
    listeners: new Map(),
    
    set(key, value) {
        this.data[key] = value;
        this.notify(key, value);
    },
    
    get(key) {
        return this.data[key];
    },
    
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    },
    
    notify(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                requestAnimationFrame(() => callback(value));
            });
        }
    }
};

// Optimized event handling
const EventManager = {
    handlers: new Map(),
    
    on(element, event, handler, options = {}) {
        const key = `${element}_${event}`;
        if (!this.handlers.has(key)) {
            this.handlers.set(key, new Set());
        }
        this.handlers.get(key).add(handler);
        element.addEventListener(event, handler, options);
    },
    
    off(element, event, handler) {
        const key = `${element}_${event}`;
        if (this.handlers.has(key)) {
            this.handlers.get(key).delete(handler);
            element.removeEventListener(event, handler);
        }
    }
};

// Optimized API calls
const API = {
    cache: new Map(),
    pending: new Map(),
    
    async get(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Return cached result if available
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Return pending promise if already in progress
        if (this.pending.has(cacheKey)) {
            return this.pending.get(cacheKey);
        }
        
        // Make new request
        const promise = fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
        
        this.pending.set(cacheKey, promise);
        
        try {
            const result = await promise;
            this.cache.set(cacheKey, result);
            return result;
        } finally {
            this.pending.delete(cacheKey);
        }
    },
    
    async post(url, data, options = {}) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    }
};

// Optimized table rendering
const TableRenderer = {
    render(headers, rows, options = {}) {
        const { sortKey = null, onSort = null } = options;
        
        const head = headers.map((h, i) => 
            `<th data-idx="${i}">${h}${sortKey && sortKey.idx === i ? (sortKey.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>`
        ).join('');
        
        const body = rows.length ? 
            rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : 
            `<tr><td colspan="${headers.length}"><small>لا توجد بيانات</small></td></tr>`;
        
        const html = `
            <table class="table">
                <thead><tr>${head}</tr></thead>
                <tbody>${body}</tbody>
            </table>
        `;
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        
        if (onSort) {
            wrapper.querySelectorAll('th').forEach(th => {
                th.addEventListener('click', () => {
                    const idx = Number(th.dataset.idx);
                    const dir = sortKey && sortKey.idx === idx && sortKey.dir === 'asc' ? 'desc' : 'asc';
                    onSort({ idx, dir });
                });
            });
        }
        
        return wrapper.innerHTML;
    }
};

// Optimized modal system
const Modal = {
    show(title, content, onSave) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="btn secondary modal-cancel">إلغاء</button>
                    <button class="btn modal-save">حفظ</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').onclick = () => this.hide(modal);
        modal.querySelector('.modal-cancel').onclick = () => this.hide(modal);
        modal.querySelector('.modal-save').onclick = () => {
            if (onSave) onSave();
            this.hide(modal);
        };
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) this.hide(modal);
        };
    },
    
    hide(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
};

// Optimized utility functions
const Utils = {
    // Debounced search
    search: debounce((query, callback) => {
        if (query.length < 2) return;
        callback(query);
    }, 300),
    
    // Throttled scroll
    scroll: throttle((callback) => {
        callback();
    }, 16), // 60fps
    
    // Format currency
    formatCurrency(value) {
        const num = Number(value || 0);
        return isFinite(num) ? new Intl.NumberFormat('ar-EG').format(num) + ' ج.م' : '';
    },
    
    // Generate unique ID
    generateId(prefix = '') {
        return prefix + '-' + Math.random().toString(36).slice(2, 9);
    },
    
    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG');
    }
};

// Initialize app with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    // Use requestIdleCallback for non-critical initialization
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            initializeApp();
        });
    } else {
        setTimeout(initializeApp, 0);
    }
});

function initializeApp() {
    // Initialize components
    initializeTabs();
    initializeForms();
    initializeTables();
    
    // Setup performance monitoring
    if ('performance' in window) {
        performance.mark('app-initialized');
    }
}

function initializeTabs() {
    const tabs = DOM.getAll('.tab');
    tabs.forEach(tab => {
        EventManager.on(tab, 'click', (e) => {
            e.preventDefault();
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            // Load content
            const view = tab.dataset.view;
            if (view) {
                loadView(view);
            }
        });
    });
}

function initializeForms() {
    const forms = DOM.getAll('form');
    forms.forEach(form => {
        EventManager.on(form, 'submit', (e) => {
            e.preventDefault();
            handleFormSubmit(form);
        });
    });
}

function initializeTables() {
    const tables = DOM.getAll('.table');
    tables.forEach(table => {
        // Add hover effects
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            EventManager.on(row, 'mouseenter', () => {
                row.style.backgroundColor = 'var(--panel)';
            });
            EventManager.on(row, 'mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });
    });
}

function loadView(viewName) {
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
        // Load view content
        console.log(`Loading view: ${viewName}`);
    });
}

function handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Process form data
    console.log('Form submitted:', data);
}

// Export for global use
window.DOM = DOM;
window.State = State;
window.API = API;
window.TableRenderer = TableRenderer;
window.Modal = Modal;
window.Utils = Utils;