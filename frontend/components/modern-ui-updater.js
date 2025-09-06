/* ===== MODERN UI UPDATER ===== */

class ModernUIUpdater {
  constructor() {
    this.originalFunctions = new Map();
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateUI());
    } else {
      this.updateUI();
    }
  }

  updateUI() {
    this.updateNavigation();
    this.updateTables();
    this.updateKPIs();
    this.updateButtons();
    this.updateForms();
    this.addLoadingStates();
    this.addEmptyStates();
  }

  updateNavigation() {
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) return;

    // Update existing tab structure to use new navigation
    const existingTabs = tabsContainer.querySelectorAll('.tab');
    existingTabs.forEach(tab => {
      tab.className = 'nav-item';
      
      // Extract icon and text
      const text = tab.textContent.trim();
      const icon = this.extractIcon(text);
      const cleanText = this.cleanText(text);
      
      tab.innerHTML = `
        <span class="nav-icon">${icon}</span>
        <span class="nav-text">${cleanText}</span>
      `;
    });
  }

  extractIcon(text) {
    const iconMap = {
      'لوحة التحكم': '📊',
      'العملاء': '👥',
      'الوحدات': '🏠',
      'الشركاء': '🤝',
      'العقود': '📋',
      'الأقساط': '💰',
      'التقارير': '📈',
      'الإعدادات': '⚙️',
      'النسخ الاحتياطي': '💾',
      'التصدير': '📤'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (text.includes(key)) {
        return icon;
      }
    }
    
    return '📄'; // Default icon
  }

  cleanText(text) {
    // Remove emojis and extra spaces
    return text.replace(/[^\u0600-\u06FF\s]/g, '').trim();
  }

  updateTables() {
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      // Add modern table wrapper
      if (!table.parentElement.classList.contains('table-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-container';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }

      // Update table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        if (!header.hasAttribute('data-sortable')) {
          header.setAttribute('data-sortable', 'true');
          header.style.cursor = 'pointer';
        }
      });

      // Add hover effects to rows
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        row.addEventListener('mouseenter', () => {
          row.style.backgroundColor = 'var(--bg-tertiary)';
        });
        row.addEventListener('mouseleave', () => {
          row.style.backgroundColor = '';
        });
      });
    });
  }

  updateKPIs() {
    const kpiContainers = document.querySelectorAll('.kpis, .kpi-grid');
    kpiContainers.forEach(container => {
      container.className = 'kpi-grid';
      
      const kpiCards = container.querySelectorAll('.kpi-card');
      kpiCards.forEach(card => {
        this.updateKPICard(card);
      });
    });
  }

  updateKPICard(card) {
    const title = card.querySelector('h3');
    const value = card.querySelector('.big');
    
    if (title && value) {
      const icon = this.getKPIIcon(title.textContent);
      
      card.innerHTML = `
        <div class="kpi-header">
          <h3 class="kpi-title">${title.textContent}</h3>
          <span class="kpi-icon">${icon}</span>
        </div>
        <div class="kpi-value">${value.textContent}</div>
        <div class="kpi-change neutral">
          <span>—</span>
        </div>
      `;
    }
  }

  getKPIIcon(title) {
    const iconMap = {
      'إجمالي العملاء': '👥',
      'الوحدات المتاحة': '🏠',
      'إجمالي العقود': '📋',
      'الأقساط المستحقة': '💰',
      'المبيعات': '💵',
      'الأرباح': '📈',
      'المصروفات': '📉',
      'العمولة': '🤝'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (title.includes(key)) {
        return icon;
      }
    }
    
    return '📊';
  }

  updateButtons() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      // Skip if already updated
      if (button.classList.contains('btn-primary') || 
          button.classList.contains('btn-secondary')) {
        return;
      }

      // Determine button type based on existing classes
      if (button.classList.contains('ok')) {
        button.className = 'btn btn-success';
      } else if (button.classList.contains('warn')) {
        button.className = 'btn btn-danger';
      } else if (button.classList.contains('gold')) {
        button.className = 'btn btn-primary';
      } else if (button.classList.contains('secondary')) {
        button.className = 'btn btn-secondary';
      } else {
        button.className = 'btn btn-primary';
      }
    });
  }

  updateForms() {
    const inputs = document.querySelectorAll('.input, input[type="text"], input[type="email"], input[type="number"]');
    inputs.forEach(input => {
      if (!input.classList.contains('input')) {
        input.className = 'input';
      }
    });

    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      if (!select.classList.contains('select')) {
        select.className = 'select';
      }
    });
  }

  addLoadingStates() {
    // Add skeleton loading to tables when data is being loaded
    const originalShowLoading = window.showLoadingIndicator;
    if (originalShowLoading) {
      window.showLoadingIndicator = () => {
        this.showSkeletonLoading();
        originalShowLoading();
      };
    }

    // Add skeleton loading to content area
    const content = document.getElementById('view');
    if (content) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if content is being loaded
            const hasLoadingClass = Array.from(mutation.addedNodes).some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.classList?.contains('loading') || node.textContent?.includes('جاري التحميل'))
            );
            
            if (hasLoadingClass) {
              this.showContentSkeleton();
            }
          }
        });
      });
      
      observer.observe(content, { childList: true, subtree: true });
    }
  }

  showSkeletonLoading() {
    const content = document.getElementById('view');
    if (content && window.skeleton) {
      const skeletonId = window.skeleton.show(content, 'table', { rows: 5, columns: 4 });
      this.currentSkeletonId = skeletonId;
    }
  }

  showContentSkeleton() {
    const content = document.getElementById('view');
    if (content && window.skeleton) {
      // Remove existing skeleton
      if (this.currentSkeletonId) {
        window.skeleton.hide(this.currentSkeletonId);
      }
      
      // Show new skeleton based on content type
      const skeletonId = window.skeleton.show(content, 'table', { rows: 5, columns: 4 });
      this.currentSkeletonId = skeletonId;
    }
  }

  hideSkeletonLoading() {
    if (this.currentSkeletonId && window.skeleton) {
      window.skeleton.hide(this.currentSkeletonId);
      this.currentSkeletonId = null;
    }
  }

  addEmptyStates() {
    // Add empty state handling for tables
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      const tbody = table.querySelector('tbody');
      if (tbody && tbody.children.length === 0) {
        this.addEmptyState(table, 'لا توجد بيانات للعرض');
      }
    });
  }

  addEmptyState(container, message) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">📭</div>
      <div class="empty-state-message">${message}</div>
      <button class="btn btn-primary" onclick="this.parentElement.remove()">
        إضافة جديد
      </button>
    `;
    
    container.appendChild(emptyState);
  }

  // Method to update specific views
  updateDashboard() {
    this.updateKPIs();
    this.addDashboardSkeleton();
  }

  updateCustomers() {
    this.updateTables();
    this.addTableSkeleton();
  }

  updateContracts() {
    this.updateTables();
    this.addTableSkeleton();
  }

  addDashboardSkeleton() {
    const content = document.getElementById('view');
    if (content && window.skeleton) {
      const skeletonId = window.skeleton.show(content, 'kpi', { count: 4 });
      this.currentSkeletonId = skeletonId;
    }
  }

  addTableSkeleton() {
    const content = document.getElementById('view');
    if (content && window.skeleton) {
      const skeletonId = window.skeleton.show(content, 'table', { rows: 5, columns: 4 });
      this.currentSkeletonId = skeletonId;
    }
  }
}

// Initialize the modern UI updater
window.modernUI = new ModernUIUpdater();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModernUIUpdater;
}