// ⚡ Performance Enhancements with Redis-like Caching and Advanced Search

class PerformanceEnhancements {
    constructor() {
        this.cache = new Map();
        this.searchIndex = new Map();
        this.websocket = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.init();
    }

    init() {
        this.setupCaching();
        this.setupSearchIndex();
        this.setupWebSocket();
        this.setupPerformanceMonitoring();
        this.bindEvents();
    }

    // 🗄️ Redis-like Caching System
    setupCaching() {
        // Cache configuration
        this.cacheConfig = {
            maxSize: 1000,
            ttl: 5 * 60 * 1000, // 5 minutes
            cleanupInterval: 60 * 1000 // 1 minute
        };

        // Start cache cleanup
        setInterval(() => {
            this.cleanupCache();
        }, this.cacheConfig.cleanupInterval);

        console.log('✅ Caching system initialized');
    }

    // Cache operations
    set(key, value, ttl = null) {
        const now = Date.now();
        const expiry = ttl ? now + ttl : now + this.cacheConfig.ttl;
        
        this.cache.set(key, {
            value: value,
            expiry: expiry,
            createdAt: now,
            accessCount: 0
        });

        // Remove oldest items if cache is full
        if (this.cache.size > this.cacheConfig.maxSize) {
            this.evictOldest();
        }
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        // Update access count and timestamp
        item.accessCount++;
        item.lastAccessed = Date.now();

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, item] of this.cache) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.cache) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    getCacheStats() {
        const stats = {
            size: this.cache.size,
            maxSize: this.cacheConfig.maxSize,
            hitRate: 0,
            totalAccesses: 0
        };

        let totalAccesses = 0;
        for (const item of this.cache.values()) {
            totalAccesses += item.accessCount;
        }

        stats.totalAccesses = totalAccesses;
        stats.hitRate = totalAccesses > 0 ? (totalAccesses / this.cache.size) : 0;

        return stats;
    }

    // 🔍 Elasticsearch-like Search System
    setupSearchIndex() {
        this.searchConfig = {
            minScore: 0.1,
            maxResults: 100,
            fuzzyThreshold: 0.8
        };

        console.log('✅ Search index initialized');
    }

    indexDocument(id, document, fields = []) {
        const searchableFields = fields.length > 0 ? fields : Object.keys(document);
        
        for (const field of searchableFields) {
            const value = document[field];
            if (typeof value === 'string' && value.trim()) {
                const tokens = this.tokenize(value);
                for (const token of tokens) {
                    if (!this.searchIndex.has(token)) {
                        this.searchIndex.set(token, new Set());
                    }
                    this.searchIndex.get(token).add(id);
                }
            }
        }
    }

    search(query, options = {}) {
        const {
            fields = [],
            fuzzy = true,
            limit = this.searchConfig.maxResults,
            minScore = this.searchConfig.minScore
        } = options;

        const queryTokens = this.tokenize(query);
        const results = new Map();

        for (const token of queryTokens) {
            const exactMatches = this.searchIndex.get(token) || new Set();
            
            // Add exact matches
            for (const id of exactMatches) {
                const score = results.get(id) || 0;
                results.set(id, score + 1);
            }

            // Add fuzzy matches if enabled
            if (fuzzy) {
                for (const [indexToken, ids] of this.searchIndex) {
                    const similarity = this.calculateSimilarity(token, indexToken);
                    if (similarity >= this.searchConfig.fuzzyThreshold) {
                        for (const id of ids) {
                            const score = results.get(id) || 0;
                            results.set(id, score + similarity);
                        }
                    }
                }
            }
        }

        // Convert to array and sort by score
        const searchResults = Array.from(results.entries())
            .filter(([id, score]) => score >= minScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id, score]) => ({ id, score }));

        return searchResults;
    }

    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 1);
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // 🌐 WebSocket for Real-time Updates
    setupWebSocket() {
        if (!window.WebSocket) {
            console.log('WebSocket not supported');
            return;
        }

        this.connectWebSocket();
    }

    connectWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.retryCount = 0;
                this.onWebSocketOpen();
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.websocket.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.isConnected = false;
                this.onWebSocketClose();
                this.scheduleReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.onWebSocketError(error);
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.log('Max retry attempts reached');
            return;
        }

        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        this.retryCount++;

        console.log(`Reconnecting in ${delay}ms (attempt ${this.retryCount})`);
        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.processRealtimeUpdate(data);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    processRealtimeUpdate(data) {
        const { type, payload } = data;

        switch (type) {
            case 'data_updated':
                this.handleDataUpdate(payload);
                break;
            case 'notification':
                this.handleRealtimeNotification(payload);
                break;
            case 'cache_invalidate':
                this.handleCacheInvalidation(payload);
                break;
            case 'search_update':
                this.handleSearchUpdate(payload);
                break;
            default:
                console.log('Unknown WebSocket message type:', type);
        }
    }

    handleDataUpdate(payload) {
        const { table, id, operation, data } = payload;
        
        // Update local cache
        const cacheKey = `${table}_${id}`;
        if (operation === 'delete') {
            this.cache.delete(cacheKey);
        } else {
            this.cache.set(cacheKey, data);
        }

        // Update search index
        if (operation === 'delete') {
            this.removeFromSearchIndex(table, id);
        } else {
            this.indexDocument(`${table}_${id}`, data);
        }

        // Trigger UI update
        this.triggerDataChange(table, { id, operation, data });
    }

    handleRealtimeNotification(payload) {
        if (window.notificationSystem) {
            window.notificationSystem.createNotification(payload);
        }
    }

    handleCacheInvalidation(payload) {
        const { keys } = payload;
        if (keys) {
            keys.forEach(key => this.cache.delete(key));
        } else {
            this.cache.clear();
        }
    }

    handleSearchUpdate(payload) {
        const { table, documents } = payload;
        documents.forEach(doc => {
            this.indexDocument(`${table}_${doc.id}`, doc);
        });
    }

    // 📊 Performance Monitoring
    setupPerformanceMonitoring() {
        this.performanceMetrics = {
            pageLoadTime: 0,
            apiResponseTime: 0,
            cacheHitRate: 0,
            searchQueryTime: 0,
            memoryUsage: 0
        };

        this.startPerformanceMonitoring();
    }

    startPerformanceMonitoring() {
        // Monitor page load time
        window.addEventListener('load', () => {
            this.performanceMetrics.pageLoadTime = performance.now();
        });

        // Monitor memory usage
        setInterval(() => {
            if (performance.memory) {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
            }
        }, 10000);

        // Monitor API response times
        this.interceptFetch();
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                this.performanceMetrics.apiResponseTime = endTime - startTime;
                return response;
            } catch (error) {
                const endTime = performance.now();
                this.performanceMetrics.apiResponseTime = endTime - startTime;
                throw error;
            }
        };
    }

    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheStats: this.getCacheStats(),
            searchIndexSize: this.searchIndex.size,
            websocketConnected: this.isConnected
        };
    }

    // 🚀 Optimized API Methods
    async cachedFetch(url, options = {}) {
        const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
        const cached = this.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const response = await fetch(url, options);
        const data = await response.json();
        
        // Cache for 5 minutes
        this.set(cacheKey, data, 5 * 60 * 1000);
        
        return data;
    }

    async searchWithCache(query, options = {}) {
        const cacheKey = `search_${query}_${JSON.stringify(options)}`;
        const cached = this.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const startTime = performance.now();
        const results = this.search(query, options);
        const endTime = performance.now();
        
        this.performanceMetrics.searchQueryTime = endTime - startTime;
        
        // Cache search results for 2 minutes
        this.set(cacheKey, results, 2 * 60 * 1000);
        
        return results;
    }

    // 🔄 Data Synchronization
    async syncData() {
        try {
            // Sync with server
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lastSync: this.getLastSyncTime(),
                    cacheKeys: Array.from(this.cache.keys())
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.processSyncData(data);
                this.setLastSyncTime(Date.now());
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    processSyncData(data) {
        const { updates, deletions, cacheInvalidations } = data;

        // Process updates
        if (updates) {
            updates.forEach(update => {
                this.handleDataUpdate(update);
            });
        }

        // Process deletions
        if (deletions) {
            deletions.forEach(key => {
                this.cache.delete(key);
            });
        }

        // Process cache invalidations
        if (cacheInvalidations) {
            cacheInvalidations.forEach(key => {
                this.cache.delete(key);
            });
        }
    }

    getLastSyncTime() {
        return parseInt(localStorage.getItem('lastSyncTime') || '0');
    }

    setLastSyncTime(timestamp) {
        localStorage.setItem('lastSyncTime', timestamp.toString());
    }

    // 🎯 Event Handlers
    bindEvents() {
        // Data change events
        document.addEventListener('dataChanged', (e) => {
            this.handleLocalDataChange(e.detail);
        });

        // Visibility change events
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });

        // Network status events
        window.addEventListener('online', () => {
            this.onNetworkOnline();
        });

        window.addEventListener('offline', () => {
            this.onNetworkOffline();
        });
    }

    handleLocalDataChange(detail) {
        const { type, data } = detail;
        
        // Update cache
        if (data && data.id) {
            const cacheKey = `${type}_${data.id}`;
            this.cache.set(cacheKey, data);
        }

        // Update search index
        if (data) {
            this.indexDocument(`${type}_${data.id}`, data);
        }

        // Broadcast to other tabs
        this.broadcastToOtherTabs({
            type: 'data_updated',
            payload: {
                table: type,
                id: data?.id,
                operation: 'update',
                data: data
            }
        });
    }

    broadcastToOtherTabs(message) {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('estate-manager-sync');
            channel.postMessage(message);
            channel.close();
        }
    }

    onWebSocketOpen() {
        // Subscribe to updates
        this.websocket.send(JSON.stringify({
            type: 'subscribe',
            payload: {
                tables: ['customers', 'units', 'contracts', 'installments']
            }
        }));
    }

    onWebSocketClose() {
        // Handle disconnection
        console.log('WebSocket connection lost');
    }

    onWebSocketError(error) {
        console.error('WebSocket error:', error);
    }

    onPageHidden() {
        // Pause non-essential operations
        console.log('Page hidden - pausing operations');
    }

    onPageVisible() {
        // Resume operations and sync data
        console.log('Page visible - resuming operations');
        this.syncData();
    }

    onNetworkOnline() {
        console.log('Network online - syncing data');
        this.syncData();
    }

    onNetworkOffline() {
        console.log('Network offline - using cached data');
    }

    // 🔧 Utility Methods
    triggerDataChange(type, detail) {
        const event = new CustomEvent('dataChanged', {
            detail: { type, ...detail }
        });
        document.dispatchEvent(event);
    }

    removeFromSearchIndex(table, id) {
        const searchKey = `${table}_${id}`;
        for (const [token, ids] of this.searchIndex) {
            ids.delete(searchKey);
            if (ids.size === 0) {
                this.searchIndex.delete(token);
            }
        }
    }

    // 🧹 Cleanup
    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.cache.clear();
        this.searchIndex.clear();
    }

    // 📈 Public API
    getCacheSize() {
        return this.cache.size;
    }

    getSearchIndexSize() {
        return this.searchIndex.size;
    }

    isWebSocketConnected() {
        return this.isConnected;
    }

    getMetrics() {
        return this.getPerformanceMetrics();
    }
}

// Initialize performance enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.performanceEnhancements = new PerformanceEnhancements();
});

// Add CSS for performance indicators
const performanceStyles = `
<style>
.performance-indicator {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: var(--md-surface);
    border: 1px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius);
    padding: 8px 12px;
    font-size: var(--md-font-size-xs);
    color: var(--md-on-surface-variant);
    box-shadow: var(--md-elevation-2);
    z-index: 1000;
    display: none;
}

.performance-indicator.show {
    display: block;
}

.performance-indicator .metric {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.performance-indicator .metric:last-child {
    margin-bottom: 0;
}

.performance-indicator .metric-label {
    font-weight: 500;
}

.performance-indicator .metric-value {
    color: var(--md-primary);
}

.performance-indicator .status-online {
    color: var(--md-success);
}

.performance-indicator .status-offline {
    color: var(--md-error);
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', performanceStyles);