/* 🚀 مدير الاستثمار العقاري - النسخة الحديثة المحسنة */

/* ===== GLOBAL STATE & CONFIG ===== */
let state = {};
let historyStack = [];
let historyIndex = -1;
let currentView = 'dash';
let currentParam = null;

// Performance optimizations
const DOM_CACHE = new Map();
const DEBOUNCE_DELAY = 300;
const THROTTLE_DELAY = 100;

/* ===== UTILITY FUNCTIONS ===== */

// Debounce function for better performance
function debounce(func, wait = DEBOUNCE_DELAY) {
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
function throttle(func, limit = THROTTLE_DELAY) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Optimized DOM manipulation
const DOM = {
    cache: DOM_CACHE,
    
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
    
    // Batch DOM updates for better performance
    batchUpdate(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => {
                const element = this.get(update.selector);
                if (element) {
                    Object.assign(element.style, update.styles);
                    if (update.classes) {
                        element.className = update.classes;
                    }
                }
            });
        });
    },
    
    // Add smooth animations
    animate(element, keyframes, options = {}) {
        if (element && element.animate) {
            return element.animate(keyframes, {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards',
                ...options
            });
        }
    }
};

/* ===== MODERN UI ENHANCEMENTS ===== */

// Enhanced loading indicator with modern design
function showLoadingIndicator(message = 'جاري التحميل...') {
    hideLoadingIndicator();
    
    const loadingHTML = `
        <div id="loading-overlay" class="loading-overlay">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
    
    // Add CSS for loading overlay
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-overlay {
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
            .loading-content {
                text-align: center;
                color: white;
            }
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            .loading-text {
                font-size: 16px;
                font-weight: 500;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoadingIndicator() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Modern notification system
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add notification styles if not exists
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--card);
                border: 1px solid var(--line);
                border-radius: var(--radius);
                padding: var(--space-md);
                box-shadow: var(--shadow-lg);
                backdrop-filter: blur(20px);
                z-index: 10001;
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            .notification-icon {
                font-size: 20px;
            }
            .notification-message {
                flex: 1;
                font-weight: 500;
            }
            .notification-close {
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
            .notification-close:hover {
                background: var(--line);
                color: var(--ink);
            }
            .notification-info { border-left: 4px solid var(--info); }
            .notification-success { border-left: 4px solid var(--success); }
            .notification-warning { border-left: 4px solid var(--warning); }
            .notification-error { border-left: 4px solid var(--error); }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    });
}

function getNotificationIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    return icons[type] || icons.info;
}

// Enhanced theme switching with smooth transitions
function switchTheme(theme) {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    
    if (currentTheme === theme) return;
    
    // Add transition class
    root.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Update theme
    root.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Remove transition after animation
    setTimeout(() => {
        root.style.transition = '';
    }, 300);
    
    showNotification(`تم تغيير الثيم إلى ${theme === 'dark' ? 'الداكن' : 'الفاتح'}`, 'success');
}

// Modern font size adjustment
function adjustFontSize(size) {
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem('fontSize', size);
    showNotification(`تم تغيير حجم الخط إلى ${size}px`, 'info');
}

// Enhanced search with modern UI
function createModernSearch() {
    const searchHTML = `
        <div id="modern-search" class="modern-search">
            <div class="search-overlay"></div>
            <div class="search-container">
                <div class="search-header">
                    <h3>البحث الذكي</h3>
                    <button class="search-close">&times;</button>
                </div>
                <div class="search-input-container">
                    <input type="text" id="search-input" placeholder="ابحث في جميع البيانات..." autocomplete="off">
                    <div class="search-icon">🔍</div>
                </div>
                <div class="search-results" id="search-results"></div>
                <div class="search-shortcuts">
                    <span class="shortcut">Ctrl + K للبحث</span>
                    <span class="shortcut">ESC للإغلاق</span>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('modern-search')) {
        document.body.insertAdjacentHTML('beforeend', searchHTML);
        
        // Add search styles
        if (!document.getElementById('search-styles')) {
            const style = document.createElement('style');
            style.id = 'search-styles';
            style.textContent = `
                .modern-search {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10002;
                    display: none;
                }
                .search-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                }
                .search-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 600px;
                    background: var(--card);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    overflow: hidden;
                }
                .search-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-lg);
                    border-bottom: 1px solid var(--line);
                }
                .search-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }
                .search-close {
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
                .search-close:hover {
                    background: var(--line);
                    color: var(--ink);
                }
                .search-input-container {
                    position: relative;
                    padding: var(--space-lg);
                }
                .search-input-container input {
                    width: 100%;
                    padding: var(--space-md) var(--space-lg) var(--space-md) 50px;
                    border: 2px solid var(--line);
                    border-radius: var(--radius);
                    background: var(--panel);
                    color: var(--ink);
                    font-size: 16px;
                    transition: var(--transition);
                }
                .search-input-container input:focus {
                    outline: none;
                    border-color: var(--primary-500);
                    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
                }
                .search-icon {
                    position: absolute;
                    left: var(--space-lg);
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 20px;
                    color: var(--muted);
                }
                .search-results {
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 0 var(--space-lg) var(--space-lg);
                }
                .search-shortcuts {
                    display: flex;
                    gap: var(--space-md);
                    padding: var(--space-md) var(--space-lg);
                    background: var(--panel);
                    border-top: 1px solid var(--line);
                }
                .shortcut {
                    font-size: 12px;
                    color: var(--muted);
                    background: var(--card);
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--radius-sm);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add event listeners
        setupSearchEventListeners();
    }
}

function setupSearchEventListeners() {
    const searchModal = document.getElementById('modern-search');
    const searchInput = document.getElementById('search-input');
    const searchClose = document.querySelector('.search-close');
    const searchOverlay = document.querySelector('.search-overlay');
    
    // Open search with Ctrl+K
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === 'Escape') {
            closeSearch();
        }
    });
    
    // Close search
    searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', closeSearch);
    
    // Search functionality
    searchInput.addEventListener('input', debounce(performSearch, 300));
    
    function openSearch() {
        searchModal.style.display = 'block';
        searchInput.focus();
        searchInput.value = '';
        document.getElementById('search-results').innerHTML = '';
    }
    
    function closeSearch() {
        searchModal.style.display = 'none';
        searchInput.blur();
    }
    
    function performSearch() {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }
        
        // Perform search logic here
        const results = performGlobalSearch(query);
        displaySearchResults(results);
    }
    
    function displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
            return;
        }
        
        const resultsHTML = results.map(result => `
            <div class="search-result-item" onclick="navigateToResult('${result.type}', '${result.id}')">
                <div class="result-icon">${result.icon}</div>
                <div class="result-content">
                    <div class="result-title">${result.title}</div>
                    <div class="result-subtitle">${result.subtitle}</div>
                </div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = resultsHTML;
    }
}

function performGlobalSearch(query) {
    // This would integrate with your existing search functionality
    // For now, return mock data
    return [
        { type: 'customer', id: '1', icon: '👤', title: 'عميل 1', subtitle: 'بيانات العميل' },
        { type: 'unit', id: '1', icon: '🏢', title: 'وحدة 1', subtitle: 'بيانات الوحدة' },
        { type: 'contract', id: '1', icon: '📄', title: 'عقد 1', subtitle: 'بيانات العقد' }
    ];
}

function navigateToResult(type, id) {
    // Navigate to the specific result
    console.log(`Navigating to ${type}: ${id}`);
    closeSearch();
}

/* ===== ENHANCED ANIMATIONS ===== */

// Add smooth page transitions
function addPageTransition() {
    const content = document.getElementById('view');
    if (content) {
        content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }
}

function showPageTransition() {
    const content = document.getElementById('view');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
    }
}

function hidePageTransition() {
    const content = document.getElementById('view');
    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }
}

// Enhanced button interactions
function enhanceButtons() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(0) scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
    });
}

// Enhanced card interactions
function enhanceCards() {
    const cards = document.querySelectorAll('.card, .panel');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = 'var(--shadow-xl)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
}

/* ===== PERFORMANCE OPTIMIZATIONS ===== */

// Lazy loading for images and heavy content
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Optimize scroll performance
function optimizeScroll() {
    let ticking = false;
    
    function updateScroll() {
        // Update scroll-dependent elements
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick, { passive: true });
}

// Memory management
function cleanupMemory() {
    // Clear unused DOM cache entries
    if (DOM_CACHE.size > 100) {
        const entries = Array.from(DOM_CACHE.entries());
        const toRemove = entries.slice(0, 50);
        toRemove.forEach(([key, value]) => {
            if (!document.contains(value)) {
                DOM_CACHE.delete(key);
            }
        });
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupMemory, 5 * 60 * 1000);

/* ===== INITIALIZATION ===== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modern features
    createModernSearch();
    addPageTransition();
    enhanceButtons();
    enhanceCards();
    setupLazyLoading();
    optimizeScroll();
    
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.documentElement.style.fontSize = `${savedFontSize}px`;
    }
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('تم تحميل النسخة الحديثة بنجاح! 🚀', 'success');
    }, 1000);
});

/* ===== EXPORT FOR GLOBAL USE ===== */
window.ModernApp = {
    showLoadingIndicator,
    hideLoadingIndicator,
    showNotification,
    switchTheme,
    adjustFontSize,
    DOM,
    debounce,
    throttle
};