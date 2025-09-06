/* ===== PERFORMANCE OPTIMIZER ===== */

class PerformanceOptimizer {
  constructor() {
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupDebouncing();
    this.setupVirtualScrolling();
    this.optimizeImages();
    this.setupMemoryManagement();
  }

  // Lazy loading for images and heavy content
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Debounce function calls to prevent excessive execution
  setupDebouncing() {
    // Debounce search inputs
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
    searchInputs.forEach(input => {
      input.addEventListener('input', this.debounce((e) => {
        this.handleSearch(e.target.value);
      }, 300));
    });

    // Debounce resize events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
  }

  debounce(func, wait) {
    return (...args) => {
      const key = func.toString();
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.set(key, setTimeout(() => func.apply(this, args), wait));
    };
  }

  handleSearch(query) {
    // Implement search functionality
    if (window.smartSearch) {
      window.smartSearch.search(query);
    }
  }

  handleResize() {
    // Update responsive layouts
    this.updateResponsiveLayout();
  }

  updateResponsiveLayout() {
    const width = window.innerWidth;
    const kpiGrid = document.querySelector('.kpi-grid');
    
    if (kpiGrid) {
      if (width < 768) {
        kpiGrid.style.gridTemplateColumns = '1fr';
      } else if (width < 1024) {
        kpiGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      } else {
        kpiGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      }
    }
  }

  // Virtual scrolling for large tables
  setupVirtualScrolling() {
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      if (table.rows.length > 100) {
        this.enableVirtualScrolling(table);
      }
    });
  }

  enableVirtualScrolling(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.rows);
    const rowHeight = 50; // Approximate row height
    const visibleRows = Math.ceil(window.innerHeight / rowHeight) + 5;
    
    let startIndex = 0;
    let endIndex = Math.min(visibleRows, rows.length);

    const updateVisibleRows = () => {
      // Hide all rows
      rows.forEach(row => row.style.display = 'none');
      
      // Show visible rows
      for (let i = startIndex; i < endIndex; i++) {
        if (rows[i]) {
          rows[i].style.display = '';
        }
      }
    };

    // Initial render
    updateVisibleRows();

    // Add scroll listener to table container
    const container = table.closest('.table-container');
    if (container) {
      container.addEventListener('scroll', this.debounce(() => {
        const scrollTop = container.scrollTop;
        startIndex = Math.floor(scrollTop / rowHeight);
        endIndex = Math.min(startIndex + visibleRows, rows.length);
        updateVisibleRows();
      }, 16)); // ~60fps
    }
  }

  // Optimize images
  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" if not present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add error handling
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMkwyOCAyMEwyMCAyOEwxMiAyMEwyMCAxMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
        img.alt = 'صورة غير متاحة';
      });
    });
  }

  // Memory management
  setupMemoryManagement() {
    // Clean up unused DOM elements
    setInterval(() => {
      this.cleanupUnusedElements();
    }, 30000); // Every 30 seconds

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  cleanupUnusedElements() {
    // Remove skeleton loaders that are no longer needed
    const skeletons = document.querySelectorAll('[data-skeleton-id]');
    skeletons.forEach(skeleton => {
      if (!skeleton.isConnected || skeleton.offsetParent === null) {
        skeleton.remove();
      }
    });

    // Remove old toast notifications
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
      const createdAt = toast.dataset.createdAt;
      if (createdAt && Date.now() - parseInt(createdAt) > 10000) { // 10 seconds
        toast.remove();
      }
    });
  }

  cleanup() {
    // Clear all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // Optimize table rendering
  optimizeTableRendering(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Use DocumentFragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    const rows = Array.from(tbody.rows);
    
    // Clear tbody
    tbody.innerHTML = '';
    
    // Add rows to fragment
    rows.forEach(row => fragment.appendChild(row));
    
    // Append fragment to tbody
    tbody.appendChild(fragment);
  }

  // Optimize chart rendering
  optimizeChartRendering(chart) {
    if (chart && chart.resize) {
      // Debounce chart resize
      const resizeChart = this.debounce(() => {
        chart.resize();
      }, 250);
      
      window.addEventListener('resize', resizeChart);
    }
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      'src/styles/design-system.css',
      'src/styles/components.css',
      'src/styles/layout.css'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'style';
      document.head.appendChild(link);
    });
  }

  // Optimize CSS delivery
  optimizeCSSDelivery() {
    // Inline critical CSS
    const criticalCSS = `
      .container { max-width: 1400px; margin: 0 auto; padding: 1.5rem; }
      .header { display: flex; align-items: center; justify-content: space-between; }
      .main-layout { display: flex; gap: 1.5rem; }
      .sidebar { width: 280px; flex-shrink: 0; }
      .content { flex: 1; min-width: 0; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    if ('performance' in window) {
      // Monitor Core Web Vitals
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
    }
  }

  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }
  }

  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    }
  }

  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }
}

// Initialize performance optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}