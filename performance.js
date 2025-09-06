/* ⚡ تحسينات الأداء المتقدمة */

/* ===== PERFORMANCE MONITORING ===== */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0
        };
        this.init();
    }
    
    init() {
        this.measurePageLoad();
        this.measureWebVitals();
        this.setupPerformanceObserver();
    }
    
    measurePageLoad() {
        window.addEventListener('load', () => {
            this.metrics.pageLoad = performance.now();
            console.log('Page load time:', this.metrics.pageLoad + 'ms');
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.domContentLoaded = performance.now();
            console.log('DOM content loaded:', this.metrics.domContentLoaded + 'ms');
        });
    }
    
    measureWebVitals() {
        // First Paint
        if ('performance' in window) {
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaint = entry.startTime;
                } else if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                }
            });
        }
    }
    
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            
            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.cumulativeLayoutShift = clsValue;
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    logMetrics() {
        console.group('Performance Metrics');
        console.log('Page Load:', this.metrics.pageLoad + 'ms');
        console.log('DOM Content Loaded:', this.metrics.domContentLoaded + 'ms');
        console.log('First Paint:', this.metrics.firstPaint + 'ms');
        console.log('First Contentful Paint:', this.metrics.firstContentfulPaint + 'ms');
        console.log('Largest Contentful Paint:', this.metrics.largestContentfulPaint + 'ms');
        console.log('First Input Delay:', this.metrics.firstInputDelay + 'ms');
        console.log('Cumulative Layout Shift:', this.metrics.cumulativeLayoutShift);
        console.groupEnd();
    }
}

/* ===== MEMORY MANAGEMENT ===== */
class MemoryManager {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 100;
        this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
        this.init();
    }
    
    init() {
        // Cleanup cache periodically
        setInterval(() => {
            this.cleanupCache();
        }, this.cleanupInterval);
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.clearCache();
        });
    }
    
    set(key, value, ttl = 300000) { // 5 minutes default TTL
        const item = {
            value,
            timestamp: Date.now(),
            ttl
        };
        
        this.cache.set(key, item);
        
        // Remove oldest items if cache is full
        if (this.cache.size > this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        return this.cache.delete(key);
    }
    
    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
            }
        }
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    getCacheSize() {
        return this.cache.size;
    }
}

/* ===== LAZY LOADING ===== */
class LazyLoader {
    constructor() {
        this.observer = null;
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadElement(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
        }
    }
    
    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadElement(element);
        }
    }
    
    loadElement(element) {
        const src = element.dataset.src;
        if (src) {
            if (element.tagName === 'IMG') {
                element.src = src;
            } else if (element.tagName === 'IFRAME') {
                element.src = src;
            }
            element.classList.remove('lazy');
        }
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/* ===== VIRTUAL SCROLLING ===== */
class VirtualScroller {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.data = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.containerHeight = 0;
        this.init();
    }
    
    init() {
        this.containerHeight = this.container.clientHeight;
        this.visibleEnd = Math.ceil(this.containerHeight / this.itemHeight);
        
        this.container.addEventListener('scroll', this.throttle(() => {
            this.updateVisibleItems();
        }, 16));
        
        this.updateVisibleItems();
    }
    
    setData(data) {
        this.data = data;
        this.updateVisibleItems();
    }
    
    updateVisibleItems() {
        const scrollTop = this.container.scrollTop;
        const newVisibleStart = Math.floor(scrollTop / this.itemHeight);
        const newVisibleEnd = Math.min(
            newVisibleStart + this.visibleEnd,
            this.data.length
        );
        
        if (newVisibleStart !== this.visibleStart || newVisibleEnd !== this.visibleEnd) {
            this.visibleStart = newVisibleStart;
            this.visibleEnd = newVisibleEnd;
            this.render();
        }
    }
    
    render() {
        const visibleData = this.data.slice(this.visibleStart, this.visibleEnd);
        const offsetY = this.visibleStart * this.itemHeight;
        
        this.container.innerHTML = `
            <div style="height: ${this.data.length * this.itemHeight}px; position: relative;">
                <div style="transform: translateY(${offsetY}px);">
                    ${visibleData.map((item, index) => 
                        this.renderItem(item, this.visibleStart + index)
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    throttle(func, limit) {
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
}

/* ===== IMAGE OPTIMIZATION ===== */
class ImageOptimizer {
    constructor() {
        this.init();
    }
    
    init() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.classList.add('lazy');
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';
        });
    }
    
    optimizeImage(img) {
        // Add loading animation
        img.style.background = 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)';
        img.style.backgroundSize = '200% 100%';
        img.style.animation = 'shimmer 1.5s infinite';
        
        img.onload = () => {
            img.style.background = 'none';
            img.style.animation = 'none';
        };
        
        img.onerror = () => {
            img.style.background = 'none';
            img.style.animation = 'none';
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJTNi40OCAyMiAxMiAyMlMyMiAxNy41MiAyMiAxMlMxNy41MiAyIDEyIDJaTTEzIDE3SDEzVjE1SDEzVjE3Wk0xMyAxM0gxM1Y3SDEzVjEzWiIgZmlsbD0iIzk5OTk5OSIvPjwvc3ZnPg==';
        };
    }
}

/* ===== BUNDLE OPTIMIZATION ===== */
class BundleOptimizer {
    constructor() {
        this.loadedModules = new Set();
        this.moduleCache = new Map();
        this.init();
    }
    
    init() {
        // Preload critical modules
        this.preloadCriticalModules();
    }
    
    preloadCriticalModules() {
        const criticalModules = [
            'core.js',
            'utils.js',
            'app.js'
        ];
        
        criticalModules.forEach(module => {
            this.preloadModule(module);
        });
    }
    
    preloadModule(module) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = module;
        link.as = 'script';
        document.head.appendChild(link);
    }
    
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return this.moduleCache.get(moduleName);
        }
        
        try {
            const module = await import(`./${moduleName}`);
            this.loadedModules.add(moduleName);
            this.moduleCache.set(moduleName, module);
            return module;
        } catch (error) {
            console.error(`Error loading module ${moduleName}:`, error);
            return null;
        }
    }
}

/* ===== NETWORK OPTIMIZATION ===== */
class NetworkOptimizer {
    constructor() {
        this.requestCache = new Map();
        this.requestQueue = [];
        this.maxConcurrentRequests = 6;
        this.activeRequests = 0;
        this.init();
    }
    
    init() {
        // Setup request interceptors
        this.setupFetchInterceptor();
    }
    
    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const cacheKey = `${url}-${JSON.stringify(options)}`;
            
            // Check cache first
            if (options.method === 'GET' && this.requestCache.has(cacheKey)) {
                const cached = this.requestCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 300000) { // 5 minutes
                    return new Response(JSON.stringify(cached.data));
                }
            }
            
            // Queue request if too many active
            if (this.activeRequests >= this.maxConcurrentRequests) {
                return new Promise((resolve) => {
                    this.requestQueue.push(() => {
                        this.makeRequest(url, options).then(resolve);
                    });
                });
            }
            
            return this.makeRequest(url, options);
        };
    }
    
    async makeRequest(url, options) {
        this.activeRequests++;
        
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            // Cache GET requests
            if (options.method === 'GET') {
                const cacheKey = `${url}-${JSON.stringify(options)}`;
                this.requestCache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return response;
        } finally {
            this.activeRequests--;
            
            // Process queued requests
            if (this.requestQueue.length > 0) {
                const nextRequest = this.requestQueue.shift();
                nextRequest();
            }
        }
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize performance monitoring
    window.performanceMonitor = new PerformanceMonitor();
    
    // Initialize memory management
    window.memoryManager = new MemoryManager();
    
    // Initialize lazy loading
    window.lazyLoader = new LazyLoader();
    
    // Initialize image optimization
    window.imageOptimizer = new ImageOptimizer();
    
    // Initialize bundle optimization
    window.bundleOptimizer = new BundleOptimizer();
    
    // Initialize network optimization
    window.networkOptimizer = new NetworkOptimizer();
    
    // Log performance metrics after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.performanceMonitor.logMetrics();
        }, 1000);
    });
});

/* ===== EXPORT ===== */
window.PerformanceMonitor = PerformanceMonitor;
window.MemoryManager = MemoryManager;
window.LazyLoader = LazyLoader;
window.VirtualScroller = VirtualScroller;
window.ImageOptimizer = ImageOptimizer;
window.BundleOptimizer = BundleOptimizer;
window.NetworkOptimizer = NetworkOptimizer;