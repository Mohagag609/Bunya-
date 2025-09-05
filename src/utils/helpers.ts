// Utility functions for the Estate Manager application

// Currency formatting
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Short currency format (EGP)
export function formatCurrencyShort(amount: number): string {
    return `ج.م ${amount.toLocaleString('ar-EG')}`;
}

// Date formatting
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Date formatting for inputs
export function formatDateInput(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Number parsing with fallback
export function parseNumber(value: string | number, fallback: number = 0): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
}

// Generate unique ID
export function generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// Deep clone object
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Search and filter utilities
export function searchItems<T>(
    items: T[],
    searchTerm: string,
    searchFields: (keyof T)[]
): T[] {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
        searchFields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(term);
        })
    );
}

export function sortItems<T>(
    items: T[],
    sortBy: keyof T,
    sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
    return [...items].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
}

// Validation utilities
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

export function validateRequired(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
}

// Local storage utilities
export function saveToLocalStorage(key: string, value: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

// File utilities
export function downloadFile(data: any, filename: string, type: string = 'application/json'): void {
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

// Chart utilities
export function getChartColors(): string[] {
    return [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
}

// Status utilities
export function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        'active': '#10b981',
        'completed': '#059669',
        'cancelled': '#dc2626',
        'pending': '#f59e0b',
        'paid': '#10b981',
        'overdue': '#dc2626',
        'available': '#10b981',
        'sold': '#059669',
        'reserved': '#f59e0b'
    };
    return statusColors[status] || '#6b7280';
}

export function getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
        'active': 'نشط',
        'completed': 'مكتمل',
        'cancelled': 'ملغي',
        'pending': 'معلق',
        'paid': 'مدفوع',
        'overdue': 'متأخر',
        'available': 'متاح',
        'sold': 'مباع',
        'reserved': 'محجوز'
    };
    return statusTexts[status] || status;
}

// Table utilities
export function createTableHTML(
    headers: string[],
    rows: string[][],
    className: string = 'table'
): string {
    const headerRow = headers.map(header => `<th>${header}</th>`).join('');
    const dataRows = rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `
        <table class="${className}">
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${dataRows}</tbody>
        </table>
    `;
}

// Error handling utilities
export function handleError(error: unknown, defaultMessage: string = 'حدث خطأ غير متوقع'): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return defaultMessage;
}

// Performance utilities
export function measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
}

// Async performance measurement
export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
}