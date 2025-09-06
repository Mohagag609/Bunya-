/* 🛠️ الوظائف المساعدة والمساعدات */

/* ===== UTILITY FUNCTIONS ===== */

// Format currency
function formatCurrency(amount, currency = 'ريال') {
    if (typeof amount !== 'number') return '0 ' + currency;
    return amount.toLocaleString('ar-SA') + ' ' + currency;
}

// Format date
function formatDate(date, options = {}) {
    if (!date) return '';
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    return new Date(date).toLocaleDateString('ar-SA', defaultOptions);
}

// Format date and time
function formatDateTime(date) {
    return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Deep clone object
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Debounce function
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function
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
    };
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Random number between min and max
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Group array by key
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

// Sort array by key
function sortBy(array, key, direction = 'asc') {
    return array.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Filter array by search term
function filterBySearch(array, searchTerm, keys = []) {
    if (!searchTerm) return array;
    
    const term = searchTerm.toLowerCase();
    return array.filter(item => {
        if (keys.length === 0) {
            return Object.values(item).some(value => 
                String(value).toLowerCase().includes(term)
            );
        }
        
        return keys.some(key => 
            String(item[key] || '').toLowerCase().includes(term)
        );
    });
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Validate required fields
function validateRequired(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].toString().trim() === '') {
            errors.push(`${field} مطلوب`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Sanitize HTML
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Escape HTML
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Get file extension
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

// Download file
function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Get query parameters
function getQueryParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    
    return params;
}

// Set query parameter
function setQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

// Remove query parameter
function removeQueryParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

// Local storage helpers
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Session storage helpers
const SessionStorage = {
    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from sessionStorage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing sessionStorage:', error);
            return false;
        }
    }
};

// DOM helpers
const DOM = {
    // Get element by selector
    get(selector) {
        return document.querySelector(selector);
    },
    
    // Get all elements by selector
    getAll(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Create element with attributes
    create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    },
    
    // Add event listener
    on(element, event, handler) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.addEventListener(event, handler);
        }
    },
    
    // Remove event listener
    off(element, event, handler) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.removeEventListener(event, handler);
        }
    },
    
    // Add class
    addClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.classList.add(className);
        }
    },
    
    // Remove class
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.classList.remove(className);
        }
    },
    
    // Toggle class
    toggleClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.classList.toggle(className);
        }
    },
    
    // Show element
    show(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.style.display = '';
        }
    },
    
    // Hide element
    hide(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        
        if (element) {
            element.style.display = 'none';
        }
    }
};

// Export all utilities
window.Utils = {
    formatCurrency,
    formatDate,
    formatDateTime,
    generateId,
    deepClone,
    debounce,
    throttle,
    sleep,
    randomBetween,
    shuffleArray,
    groupBy,
    sortBy,
    filterBySearch,
    isValidEmail,
    isValidPhone,
    validateRequired,
    sanitizeHTML,
    escapeHTML,
    getFileExtension,
    formatFileSize,
    copyToClipboard,
    downloadFile,
    getQueryParams,
    setQueryParam,
    removeQueryParam,
    Storage,
    SessionStorage,
    DOM
};