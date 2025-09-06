// 🔍 Smart Search with Autocomplete for Estate Manager

class SmartSearch {
    constructor() {
        this.searchIndex = new Map();
        this.searchHistory = [];
        this.currentQuery = '';
        this.searchResults = [];
        this.isSearching = false;
        this.debounceTimer = null;
        this.init();
    }

    init() {
        this.createSearchInterface();
        this.buildSearchIndex();
        this.bindEvents();
        this.setupKeyboardShortcuts();
    }

    createSearchInterface() {
        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.id = 'smart-search-container';
        searchContainer.className = 'smart-search-container';
        searchContainer.innerHTML = `
            <div class="search-wrapper">
                <div class="search-input-container">
                    <input 
                        type="text" 
                        id="smart-search-input" 
                        class="smart-search-input" 
                        placeholder="ابحث في العملاء، الوحدات، العقود..."
                        autocomplete="off"
                    >
                    <div class="search-icon">
                        <span class="material-icons">search</span>
                    </div>
                    <button class="search-clear" id="search-clear" style="display: none;">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="search-suggestions" id="search-suggestions"></div>
                <div class="search-results" id="search-results"></div>
            </div>
        `;

        // Add to header
        const header = document.querySelector('.header');
        if (header) {
            const tools = header.querySelector('.tools');
            if (tools) {
                tools.insertBefore(searchContainer, tools.firstChild);
            }
        }
    }

    buildSearchIndex() {
        this.searchIndex.clear();
        
        // Index customers
        if (state.customers) {
            state.customers.forEach(customer => {
                this.addToIndex('customer', customer.id, {
                    title: customer.name || 'عميل بدون اسم',
                    subtitle: customer.phone || 'لا يوجد رقم هاتف',
                    type: 'customer',
                    data: customer,
                    searchableText: [
                        customer.name,
                        customer.phone,
                        customer.email,
                        customer.address,
                        customer.notes
                    ].filter(Boolean).join(' ')
                });
            });
        }

        // Index units
        if (state.units) {
            state.units.forEach(unit => {
                this.addToIndex('unit', unit.id, {
                    title: unit.name || unit.code || 'وحدة بدون اسم',
                    subtitle: `الكود: ${unit.code || 'غير محدد'} | الدور: ${unit.floor || 'غير محدد'}`,
                    type: 'unit',
                    data: unit,
                    searchableText: [
                        unit.name,
                        unit.code,
                        unit.building,
                        unit.floor,
                        unit.area,
                        unit.price,
                        unit.notes
                    ].filter(Boolean).join(' ')
                });
            });
        }

        // Index contracts
        if (state.contracts) {
            state.contracts.forEach(contract => {
                this.addToIndex('contract', contract.id, {
                    title: `عقد ${contract.unitCode || 'غير محدد'}`,
                    subtitle: `العميل: ${contract.customerName || 'غير محدد'} | التاريخ: ${contract.date || 'غير محدد'}`,
                    type: 'contract',
                    data: contract,
                    searchableText: [
                        contract.unitCode,
                        contract.customerName,
                        contract.date,
                        contract.totalPrice,
                        contract.notes
                    ].filter(Boolean).join(' ')
                });
            });
        }

        // Index partners
        if (state.partners) {
            state.partners.forEach(partner => {
                this.addToIndex('partner', partner.id, {
                    title: partner.name || 'شريك بدون اسم',
                    subtitle: `النسبة: ${partner.percentage || 0}%`,
                    type: 'partner',
                    data: partner,
                    searchableText: [
                        partner.name,
                        partner.phone,
                        partner.email,
                        partner.percentage,
                        partner.notes
                    ].filter(Boolean).join(' ')
                });
            });
        }

        // Index brokers
        if (state.brokers) {
            state.brokers.forEach(broker => {
                this.addToIndex('broker', broker.id, {
                    title: broker.name || 'وسيط بدون اسم',
                    subtitle: `العمولة: ${broker.commission || 0}%`,
                    type: 'broker',
                    data: broker,
                    searchableText: [
                        broker.name,
                        broker.phone,
                        broker.email,
                        broker.commission,
                        broker.notes
                    ].filter(Boolean).join(' ')
                });
            });
        }
    }

    addToIndex(category, id, item) {
        if (!this.searchIndex.has(category)) {
            this.searchIndex.set(category, new Map());
        }
        this.searchIndex.get(category).set(id, item);
    }

    bindEvents() {
        const searchInput = document.getElementById('smart-search-input');
        const searchClear = document.getElementById('search-clear');
        const searchSuggestions = document.getElementById('search-suggestions');
        const searchResults = document.getElementById('search-results');

        if (!searchInput) return;

        // Input events
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            this.showSuggestions();
        });

        searchInput.addEventListener('blur', (e) => {
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => {
                this.hideSuggestions();
            }, 200);
        });

        // Clear button
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.smart-search-container')) {
                this.hideSuggestions();
                this.hideResults();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('smart-search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Escape to clear search
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    handleSearchInput(query) {
        this.currentQuery = query.trim();
        
        // Clear previous timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Show/hide clear button
        const searchClear = document.getElementById('search-clear');
        if (searchClear) {
            searchClear.style.display = this.currentQuery ? 'block' : 'none';
        }

        if (this.currentQuery.length === 0) {
            this.hideSuggestions();
            this.hideResults();
            return;
        }

        // Debounce search
        this.debounceTimer = setTimeout(() => {
            this.performSearch(this.currentQuery);
        }, 300);
    }

    performSearch(query) {
        if (query.length < 2) return;

        this.isSearching = true;
        this.searchResults = [];

        // Search through all indexed items
        for (const [category, items] of this.searchIndex) {
            for (const [id, item] of items) {
                const score = this.calculateRelevanceScore(query, item.searchableText);
                if (score > 0) {
                    this.searchResults.push({
                        ...item,
                        score,
                        category
                    });
                }
            }
        }

        // Sort by relevance score
        this.searchResults.sort((a, b) => b.score - a.score);

        // Limit results
        this.searchResults = this.searchResults.slice(0, 20);

        this.displaySearchResults();
        this.addToHistory(query);
    }

    calculateRelevanceScore(query, text) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();

        // Exact match gets highest score
        if (textLower.includes(queryLower)) {
            let score = 100;
            
            // Boost score for exact word matches
            const words = queryLower.split(' ');
            words.forEach(word => {
                if (textLower.includes(word)) {
                    score += 50;
                }
            });

            // Boost score for title matches
            if (textLower.startsWith(queryLower)) {
                score += 30;
            }

            return score;
        }

        // Fuzzy matching for partial matches
        const queryChars = queryLower.split('');
        const textChars = textLower.split('');
        
        let matches = 0;
        let queryIndex = 0;
        
        for (let i = 0; i < textChars.length && queryIndex < queryChars.length; i++) {
            if (textChars[i] === queryChars[queryIndex]) {
                matches++;
                queryIndex++;
            }
        }

        return matches === queryChars.length ? matches * 10 : 0;
    }

    displaySearchResults() {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (this.searchResults.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <span class="material-icons">search_off</span>
                    <p>لم يتم العثور على نتائج</p>
                </div>
            `;
        } else {
            const resultsHTML = this.searchResults.map(result => `
                <div class="search-result-item" data-type="${result.type}" data-id="${result.data.id}">
                    <div class="result-icon">
                        <span class="material-icons">${this.getTypeIcon(result.type)}</span>
                    </div>
                    <div class="result-content">
                        <div class="result-title">${this.highlightQuery(result.title, this.currentQuery)}</div>
                        <div class="result-subtitle">${result.subtitle}</div>
                        <div class="result-category">${this.getTypeLabel(result.type)}</div>
                    </div>
                    <div class="result-score">${Math.round(result.score)}%</div>
                </div>
            `).join('');

            searchResults.innerHTML = `
                <div class="search-results-header">
                    <h4>نتائج البحث (${this.searchResults.length})</h4>
                    <button class="btn btn-sm secondary" onclick="smartSearch.clearSearch()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="search-results-list">
                    ${resultsHTML}
                </div>
            `;

            // Add click handlers
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.handleResultClick(item.dataset.type, item.dataset.id);
                });
            });
        }

        searchResults.style.display = 'block';
    }

    showSuggestions() {
        const searchSuggestions = document.getElementById('search-suggestions');
        if (!searchSuggestions) return;

        // Show recent searches
        const recentSearches = this.searchHistory.slice(0, 5);
        
        if (recentSearches.length > 0) {
            searchSuggestions.innerHTML = `
                <div class="suggestions-header">
                    <span class="material-icons">history</span>
                    <span>البحث الأخير</span>
                </div>
                <div class="suggestions-list">
                    ${recentSearches.map(query => `
                        <div class="suggestion-item" onclick="smartSearch.selectSuggestion('${query}')">
                            <span class="material-icons">search</span>
                            <span>${query}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            searchSuggestions.style.display = 'block';
        }
    }

    hideSuggestions() {
        const searchSuggestions = document.getElementById('search-suggestions');
        if (searchSuggestions) {
            searchSuggestions.style.display = 'none';
        }
    }

    hideResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('smart-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
        }
        
        this.currentQuery = '';
        this.searchResults = [];
        this.hideSuggestions();
        this.hideResults();
        
        const searchClear = document.getElementById('search-clear');
        if (searchClear) {
            searchClear.style.display = 'none';
        }
    }

    selectSuggestion(query) {
        const searchInput = document.getElementById('smart-search-input');
        if (searchInput) {
            searchInput.value = query;
            this.handleSearchInput(query);
        }
    }

    handleResultClick(type, id) {
        // Navigate to the appropriate view
        switch (type) {
            case 'customer':
                this.navigateToCustomer(id);
                break;
            case 'unit':
                this.navigateToUnit(id);
                break;
            case 'contract':
                this.navigateToContract(id);
                break;
            case 'partner':
                this.navigateToPartner(id);
                break;
            case 'broker':
                this.navigateToBroker(id);
                break;
        }
        
        this.clearSearch();
    }

    navigateToCustomer(customerId) {
        if (typeof nav === 'function') {
            nav('customers');
            // Focus on the specific customer
            setTimeout(() => {
                const customerElement = document.querySelector(`[data-customer-id="${customerId}"]`);
                if (customerElement) {
                    customerElement.scrollIntoView({ behavior: 'smooth' });
                    customerElement.classList.add('highlight');
                    setTimeout(() => customerElement.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    }

    navigateToUnit(unitId) {
        if (typeof nav === 'function') {
            nav('units');
            setTimeout(() => {
                const unitElement = document.querySelector(`[data-unit-id="${unitId}"]`);
                if (unitElement) {
                    unitElement.scrollIntoView({ behavior: 'smooth' });
                    unitElement.classList.add('highlight');
                    setTimeout(() => unitElement.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    }

    navigateToContract(contractId) {
        if (typeof nav === 'function') {
            nav('contracts');
            setTimeout(() => {
                const contractElement = document.querySelector(`[data-contract-id="${contractId}"]`);
                if (contractElement) {
                    contractElement.scrollIntoView({ behavior: 'smooth' });
                    contractElement.classList.add('highlight');
                    setTimeout(() => contractElement.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    }

    navigateToPartner(partnerId) {
        if (typeof nav === 'function') {
            nav('partners');
            setTimeout(() => {
                const partnerElement = document.querySelector(`[data-partner-id="${partnerId}"]`);
                if (partnerElement) {
                    partnerElement.scrollIntoView({ behavior: 'smooth' });
                    partnerElement.classList.add('highlight');
                    setTimeout(() => partnerElement.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    }

    navigateToBroker(brokerId) {
        if (typeof nav === 'function') {
            nav('brokers');
            setTimeout(() => {
                const brokerElement = document.querySelector(`[data-broker-id="${brokerId}"]`);
                if (brokerElement) {
                    brokerElement.scrollIntoView({ behavior: 'smooth' });
                    brokerElement.classList.add('highlight');
                    setTimeout(() => brokerElement.classList.remove('highlight'), 2000);
                }
            }, 100);
        }
    }

    handleKeyboardNavigation(e) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults || searchResults.style.display === 'none') return;

        const resultItems = searchResults.querySelectorAll('.search-result-item');
        const currentActive = searchResults.querySelector('.search-result-item.active');
        let activeIndex = -1;

        if (currentActive) {
            activeIndex = Array.from(resultItems).indexOf(currentActive);
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, resultItems.length - 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentActive) {
                    currentActive.click();
                }
                return;
            case 'Escape':
                this.clearSearch();
                return;
        }

        // Update active item
        resultItems.forEach((item, index) => {
            item.classList.toggle('active', index === activeIndex);
        });
    }

    addToHistory(query) {
        if (!query || query.length < 2) return;
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // Add to beginning
        this.searchHistory.unshift(query);
        
        // Keep only last 10 searches
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    loadHistory() {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                this.searchHistory = JSON.parse(saved);
            } catch (e) {
                this.searchHistory = [];
            }
        }
    }

    getTypeIcon(type) {
        const icons = {
            customer: 'person',
            unit: 'home',
            contract: 'description',
            partner: 'group',
            broker: 'store'
        };
        return icons[type] || 'search';
    }

    getTypeLabel(type) {
        const labels = {
            customer: 'عميل',
            unit: 'وحدة',
            contract: 'عقد',
            partner: 'شريك',
            broker: 'وسيط'
        };
        return labels[type] || 'غير محدد';
    }

    highlightQuery(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Public methods
    refreshIndex() {
        this.buildSearchIndex();
    }

    getSearchStats() {
        let totalItems = 0;
        for (const [category, items] of this.searchIndex) {
            totalItems += items.size;
        }
        
        return {
            totalItems,
            categories: Array.from(this.searchIndex.keys()),
            historyCount: this.searchHistory.length
        };
    }
}

// Initialize smart search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smartSearch = new SmartSearch();
    window.smartSearch.loadHistory();
});

// Add CSS for smart search
const searchStyles = `
<style>
.smart-search-container {
    position: relative;
    flex: 1;
    max-width: 400px;
    margin-left: 16px;
}

.search-wrapper {
    position: relative;
    width: 100%;
}

.search-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.smart-search-input {
    width: 100%;
    padding: 12px 48px 12px 16px;
    border: 2px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius-lg);
    background: var(--md-surface);
    color: var(--md-on-surface);
    font-size: var(--md-font-size-md);
    transition: var(--md-transition);
    direction: rtl;
}

.smart-search-input:focus {
    outline: none;
    border-color: var(--md-primary);
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.search-icon {
    position: absolute;
    right: 16px;
    color: var(--md-on-surface-variant);
    pointer-events: none;
}

.search-clear {
    position: absolute;
    left: 12px;
    background: none;
    border: none;
    color: var(--md-on-surface-variant);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: var(--md-transition);
}

.search-clear:hover {
    background: var(--md-surface-variant);
    color: var(--md-on-surface);
}

.search-suggestions,
.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--md-surface);
    border: 1px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius-lg);
    box-shadow: var(--md-elevation-3);
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;
    display: none;
}

.suggestions-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--md-surface-variant);
    font-size: var(--md-font-size-sm);
    font-weight: 500;
    color: var(--md-on-surface-variant);
}

.suggestions-list {
    padding: 8px 0;
}

.suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: var(--md-transition);
}

.suggestion-item:hover {
    background: var(--md-surface-variant);
}

.search-results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--md-surface-variant);
    border-bottom: 1px solid var(--md-surface-variant);
}

.search-results-header h4 {
    margin: 0;
    font-size: var(--md-font-size-md);
    font-weight: 600;
    color: var(--md-on-surface);
}

.search-results-list {
    padding: 8px 0;
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: var(--md-transition);
    border-bottom: 1px solid var(--md-surface-variant);
}

.search-result-item:hover,
.search-result-item.active {
    background: var(--md-surface-variant);
}

.search-result-item:last-child {
    border-bottom: none;
}

.result-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--md-primary);
    color: var(--md-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.result-content {
    flex: 1;
    min-width: 0;
}

.result-title {
    font-weight: 600;
    color: var(--md-on-surface);
    margin-bottom: 4px;
    line-height: 1.4;
}

.result-title mark {
    background: var(--md-warning);
    color: var(--md-on-primary);
    padding: 2px 4px;
    border-radius: 2px;
}

.result-subtitle {
    font-size: var(--md-font-size-sm);
    color: var(--md-on-surface-variant);
    margin-bottom: 4px;
}

.result-category {
    font-size: var(--md-font-size-xs);
    color: var(--md-primary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.result-score {
    font-size: var(--md-font-size-xs);
    color: var(--md-on-surface-variant);
    background: var(--md-surface-variant);
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 500;
}

.no-results {
    text-align: center;
    padding: 32px 16px;
    color: var(--md-on-surface-variant);
}

.no-results .material-icons {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

/* Highlight animation */
@keyframes highlight {
    0% { background-color: var(--md-warning); }
    100% { background-color: transparent; }
}

.highlight {
    animation: highlight 2s ease-in-out;
}

/* Responsive */
@media (max-width: 768px) {
    .smart-search-container {
        max-width: none;
        margin-left: 0;
        margin-bottom: 16px;
    }
    
    .search-suggestions,
    .search-results {
        max-height: 300px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', searchStyles);