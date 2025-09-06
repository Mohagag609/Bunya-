/* ✨ المميزات الإضافية والوظائف المتقدمة */

/* ===== ADVANCED SEARCH ===== */
class AdvancedSearch {
    constructor() {
        this.searchIndex = new Map();
        this.searchHistory = [];
        this.maxHistorySize = 10;
        this.init();
    }
    
    init() {
        this.setupSearchUI();
        this.buildSearchIndex();
    }
    
    setupSearchUI() {
        // Create search overlay
        const searchOverlay = document.createElement('div');
        searchOverlay.id = 'search-overlay';
        searchOverlay.className = 'search-overlay';
        searchOverlay.innerHTML = `
            <div class="search-container">
                <div class="search-header">
                    <h3>🔍 البحث المتقدم</h3>
                    <button class="search-close">&times;</button>
                </div>
                <div class="search-input-container">
                    <input type="text" id="search-input" placeholder="ابحث في جميع البيانات..." autocomplete="off">
                    <div class="search-suggestions" id="search-suggestions"></div>
                </div>
                <div class="search-filters">
                    <select id="search-type">
                        <option value="all">جميع الأنواع</option>
                        <option value="customers">العملاء</option>
                        <option value="units">الوحدات</option>
                        <option value="contracts">العقود</option>
                        <option value="installments">الأقساط</option>
                    </select>
                    <select id="search-sort">
                        <option value="relevance">الأكثر صلة</option>
                        <option value="date">التاريخ</option>
                        <option value="name">الاسم</option>
                    </select>
                </div>
                <div class="search-results" id="search-results"></div>
                <div class="search-history" id="search-history"></div>
            </div>
        `;
        
        document.body.appendChild(searchOverlay);
        
        // Add search styles
        this.addSearchStyles();
        
        // Setup event listeners
        this.setupSearchEventListeners();
    }
    
    addSearchStyles() {
        if (!document.getElementById('search-styles')) {
            const style = document.createElement('style');
            style.id = 'search-styles';
            style.textContent = `
                .search-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    z-index: 10000;
                    display: none;
                    align-items: center;
                    justify-content: center;
                }
                .search-container {
                    background: var(--card);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
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
                    padding: var(--space-md) var(--space-lg);
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
                .search-suggestions {
                    position: absolute;
                    top: 100%;
                    left: var(--space-lg);
                    right: var(--space-lg);
                    background: var(--card);
                    border: 1px solid var(--line);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-lg);
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10001;
                    display: none;
                }
                .search-suggestion {
                    padding: var(--space-md);
                    cursor: pointer;
                    transition: var(--transition);
                    border-bottom: 1px solid var(--line);
                }
                .search-suggestion:hover {
                    background: var(--panel);
                }
                .search-suggestion:last-child {
                    border-bottom: none;
                }
                .search-filters {
                    display: flex;
                    gap: var(--space-md);
                    padding: 0 var(--space-lg) var(--space-lg);
                }
                .search-filters select {
                    flex: 1;
                    padding: var(--space-sm) var(--space-md);
                    border: 1px solid var(--line);
                    border-radius: var(--radius);
                    background: var(--panel);
                    color: var(--ink);
                }
                .search-results {
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 0 var(--space-lg) var(--space-lg);
                }
                .search-result-item {
                    padding: var(--space-md);
                    border: 1px solid var(--line);
                    border-radius: var(--radius);
                    margin-bottom: var(--space-sm);
                    cursor: pointer;
                    transition: var(--transition);
                }
                .search-result-item:hover {
                    background: var(--panel);
                    transform: translateY(-1px);
                }
                .search-result-title {
                    font-weight: 600;
                    margin-bottom: var(--space-xs);
                }
                .search-result-subtitle {
                    color: var(--muted);
                    font-size: 14px;
                }
                .search-history {
                    padding: var(--space-lg);
                    border-top: 1px solid var(--line);
                    background: var(--panel);
                }
                .search-history h4 {
                    margin: 0 0 var(--space-md) 0;
                    font-size: 16px;
                    color: var(--muted);
                }
                .search-history-item {
                    padding: var(--space-sm) 0;
                    cursor: pointer;
                    color: var(--muted);
                    transition: var(--transition);
                }
                .search-history-item:hover {
                    color: var(--ink);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupSearchEventListeners() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        const searchClose = document.querySelector('.search-close');
        const searchType = document.getElementById('search-type');
        const searchSort = document.getElementById('search-sort');
        
        // Open search with Ctrl+K
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
        
        // Close search
        searchClose.addEventListener('click', () => this.closeSearch());
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                this.closeSearch();
            }
        });
        
        // Search input
        searchInput.addEventListener('input', debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Filters
        searchType.addEventListener('change', () => this.performSearch());
        searchSort.addEventListener('change', () => this.performSearch());
    }
    
    openSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        searchOverlay.style.display = 'flex';
        document.getElementById('search-input').focus();
        this.loadSearchHistory();
    }
    
    closeSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        searchOverlay.style.display = 'none';
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-suggestions').style.display = 'none';
    }
    
    buildSearchIndex() {
        // This would build a search index from your data
        // For now, we'll use a simple implementation
        this.searchIndex.set('customers', []);
        this.searchIndex.set('units', []);
        this.searchIndex.set('contracts', []);
        this.searchIndex.set('installments', []);
    }
    
    async handleSearch(query) {
        if (query.length < 2) {
            document.getElementById('search-suggestions').style.display = 'none';
            return;
        }
        
        const suggestions = await this.getSuggestions(query);
        this.showSuggestions(suggestions);
    }
    
    async getSuggestions(query) {
        // Mock suggestions - replace with actual data
        return [
            { text: 'عميل: أحمد محمد', type: 'customers' },
            { text: 'وحدة: 101', type: 'units' },
            { text: 'عقد: 2024-001', type: 'contracts' }
        ].filter(item => 
            item.text.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="search-suggestion" onclick="this.selectSuggestion('${suggestion.text}')">
                ${suggestion.text}
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
    }
    
    selectSuggestion(text) {
        document.getElementById('search-input').value = text;
        document.getElementById('search-suggestions').style.display = 'none';
        this.performSearch();
    }
    
    async performSearch() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;
        
        // Add to search history
        this.addToHistory(query);
        
        // Perform search
        const results = await this.search(query);
        this.displayResults(results);
    }
    
    async search(query) {
        const type = document.getElementById('search-type').value;
        const sort = document.getElementById('search-sort').value;
        
        // Mock search results - replace with actual search
        const mockResults = [
            {
                id: '1',
                type: 'customers',
                title: 'أحمد محمد',
                subtitle: 'عميل - 01234567890',
                icon: '👤'
            },
            {
                id: '2',
                type: 'units',
                title: 'الوحدة 101',
                subtitle: 'شقة - 120 م² - 500,000 ريال',
                icon: '🏢'
            }
        ];
        
        return mockResults.filter(result => 
            (type === 'all' || result.type === type) &&
            (result.title.toLowerCase().includes(query.toLowerCase()) ||
             result.subtitle.toLowerCase().includes(query.toLowerCase()))
        );
    }
    
    displayResults(results) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
            return;
        }
        
        resultsContainer.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="this.navigateToResult('${result.type}', '${result.id}')">
                <div class="search-result-title">
                    <span class="result-icon">${result.icon}</span>
                    ${result.title}
                </div>
                <div class="search-result-subtitle">${result.subtitle}</div>
            </div>
        `).join('');
    }
    
    navigateToResult(type, id) {
        // Navigate to the specific result
        console.log(`Navigating to ${type}: ${id}`);
        this.closeSearch();
    }
    
    addToHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            if (this.searchHistory.length > this.maxHistorySize) {
                this.searchHistory.pop();
            }
        }
    }
    
    loadSearchHistory() {
        const historyContainer = document.getElementById('search-history');
        if (this.searchHistory.length === 0) {
            historyContainer.innerHTML = '<div>لا يوجد تاريخ بحث</div>';
            return;
        }
        
        historyContainer.innerHTML = `
            <h4>تاريخ البحث</h4>
            ${this.searchHistory.map(item => `
                <div class="search-history-item" onclick="this.selectHistoryItem('${item}')">
                    ${item}
                </div>
            `).join('')}
        `;
    }
    
    selectHistoryItem(item) {
        document.getElementById('search-input').value = item;
        this.performSearch();
    }
}

/* ===== DARK MODE TOGGLE ===== */
class DarkModeToggle {
    constructor() {
        this.isDark = localStorage.getItem('theme') === 'dark';
        this.init();
    }
    
    init() {
        this.createToggle();
        this.setupEventListeners();
        this.applyTheme();
    }
    
    createToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'dark-mode-toggle';
        toggle.className = 'dark-mode-toggle';
        toggle.innerHTML = this.isDark ? '☀️' : '🌙';
        toggle.title = this.isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';
        
        // Add to header
        const tools = document.querySelector('.tools');
        if (tools) {
            tools.appendChild(toggle);
        }
        
        // Add styles
        this.addToggleStyles();
    }
    
    addToggleStyles() {
        if (!document.getElementById('dark-mode-toggle-styles')) {
            const style = document.createElement('style');
            style.id = 'dark-mode-toggle-styles';
            style.textContent = `
                .dark-mode-toggle {
                    background: var(--card);
                    border: 1px solid var(--line);
                    border-radius: var(--radius);
                    padding: var(--space-sm);
                    cursor: pointer;
                    font-size: 18px;
                    transition: var(--transition);
                    backdrop-filter: blur(10px);
                }
                .dark-mode-toggle:hover {
                    background: var(--panel);
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                this.toggle();
            });
        }
    }
    
    toggle() {
        this.isDark = !this.isDark;
        this.applyTheme();
        this.updateToggle();
        this.saveTheme();
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    }
    
    updateToggle() {
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.innerHTML = this.isDark ? '☀️' : '🌙';
            toggle.title = this.isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';
        }
    }
    
    saveTheme() {
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }
}

/* ===== QUICK ACTIONS ===== */
class QuickActions {
    constructor() {
        this.actions = new Map();
        this.init();
    }
    
    init() {
        this.createQuickActions();
        this.setupEventListeners();
    }
    
    createQuickActions() {
        const quickActions = document.createElement('div');
        quickActions.id = 'quick-actions';
        quickActions.className = 'quick-actions';
        quickActions.innerHTML = `
            <button class="quick-action" data-action="add-customer" title="إضافة عميل">
                <span class="action-icon">👤</span>
                <span class="action-text">عميل</span>
            </button>
            <button class="quick-action" data-action="add-unit" title="إضافة وحدة">
                <span class="action-icon">🏢</span>
                <span class="action-text">وحدة</span>
            </button>
            <button class="quick-action" data-action="add-contract" title="إضافة عقد">
                <span class="action-icon">📄</span>
                <span class="action-text">عقد</span>
            </button>
            <button class="quick-action" data-action="export-data" title="تصدير البيانات">
                <span class="action-icon">📤</span>
                <span class="action-text">تصدير</span>
            </button>
        `;
        
        document.body.appendChild(quickActions);
        
        // Add styles
        this.addQuickActionsStyles();
    }
    
    addQuickActionsStyles() {
        if (!document.getElementById('quick-actions-styles')) {
            const style = document.createElement('style');
            style.id = 'quick-actions-styles';
            style.textContent = `
                .quick-actions {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-sm);
                    z-index: 1000;
                }
                .quick-action {
                    background: var(--brand);
                    border: none;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: var(--transition);
                    box-shadow: var(--shadow);
                    color: white;
                    font-size: 12px;
                    font-weight: 500;
                }
                .quick-action:hover {
                    transform: scale(1.1);
                    box-shadow: var(--shadow-lg);
                }
                .action-icon {
                    font-size: 20px;
                    margin-bottom: 2px;
                }
                .action-text {
                    font-size: 10px;
                }
                @media (max-width: 768px) {
                    .quick-actions {
                        bottom: 10px;
                        right: 10px;
                    }
                    .quick-action {
                        width: 50px;
                        height: 50px;
                    }
                    .action-icon {
                        font-size: 16px;
                    }
                    .action-text {
                        font-size: 8px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        const actions = document.querySelectorAll('.quick-action');
        actions.forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = e.currentTarget.dataset.action;
                this.executeAction(actionType);
            });
        });
    }
    
    executeAction(actionType) {
        switch (actionType) {
            case 'add-customer':
                this.addCustomer();
                break;
            case 'add-unit':
                this.addUnit();
                break;
            case 'add-contract':
                this.addContract();
                break;
            case 'export-data':
                this.exportData();
                break;
        }
    }
    
    addCustomer() {
        showNotification('إضافة عميل جديد', 'info');
        // Navigate to customers view and open add form
        if (typeof navigateToView === 'function') {
            navigateToView('customers');
        }
    }
    
    addUnit() {
        showNotification('إضافة وحدة جديدة', 'info');
        // Navigate to units view and open add form
        if (typeof navigateToView === 'function') {
            navigateToView('units');
        }
    }
    
    addContract() {
        showNotification('إضافة عقد جديد', 'info');
        // Navigate to contracts view and open add form
        if (typeof navigateToView === 'function') {
            navigateToView('contracts');
        }
    }
    
    exportData() {
        showNotification('تصدير البيانات', 'info');
        // Open export dialog
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize advanced search
    window.advancedSearch = new AdvancedSearch();
    
    // Initialize dark mode toggle
    window.darkModeToggle = new DarkModeToggle();
    
    // Initialize quick actions
    window.quickActions = new QuickActions();
});

/* ===== EXPORT ===== */
window.AdvancedSearch = AdvancedSearch;
window.DarkModeToggle = DarkModeToggle;
window.QuickActions = QuickActions;