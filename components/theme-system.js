/* ===== THEME SYSTEM - RTL & DARK/LIGHT SUPPORT ===== */

class ThemeSystem {
  constructor() {
    this.currentTheme = 'dark';
    this.currentDirection = 'rtl';
    this.init();
  }

  init() {
    // Load saved theme and direction
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.currentDirection = localStorage.getItem('direction') || 'rtl';
    
    // Apply initial theme and direction
    this.applyTheme(this.currentTheme);
    this.applyDirection(this.currentDirection);
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Theme selector
    const themeSelector = document.getElementById('themeSel');
    if (themeSelector) {
      themeSelector.value = this.currentTheme;
      themeSelector.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    }

    // Direction toggle (if exists)
    const directionToggle = document.getElementById('directionToggle');
    if (directionToggle) {
      directionToggle.addEventListener('click', () => {
        this.toggleDirection();
      });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
    
    // Update theme selector if exists
    const themeSelector = document.getElementById('themeSel');
    if (themeSelector) {
      themeSelector.value = theme;
    }

    // Show toast notification
    if (window.toast) {
      window.toast.info(`تم تغيير الثيم إلى ${theme === 'dark' ? 'الداكن' : 'الفاتح'}`);
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    if (theme === 'dark') {
      metaThemeColor.content = '#0f172a';
    } else {
      metaThemeColor.content = '#f8fafc';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setDirection(direction) {
    this.currentDirection = direction;
    localStorage.setItem('direction', direction);
    this.applyDirection(direction);
    
    // Show toast notification
    if (window.toast) {
      window.toast.info(`تم تغيير الاتجاه إلى ${direction === 'rtl' ? 'من اليمين لليسار' : 'من اليسار لليمين'}`);
    }
  }

  applyDirection(direction) {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', direction === 'rtl' ? 'ar' : 'en');
  }

  toggleDirection() {
    const newDirection = this.currentDirection === 'rtl' ? 'ltr' : 'rtl';
    this.setDirection(newDirection);
  }

  // Get current theme
  getTheme() {
    return this.currentTheme;
  }

  // Get current direction
  getDirection() {
    return this.currentDirection;
  }

  // Check if dark theme is active
  isDark() {
    return this.currentTheme === 'dark';
  }

  // Check if RTL is active
  isRTL() {
    return this.currentDirection === 'rtl';
  }

  // Reset to system preferences
  resetToSystem() {
    localStorage.removeItem('theme');
    localStorage.removeItem('direction');
    
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersRTL = navigator.language.startsWith('ar') || navigator.language.startsWith('he');
    
    this.setTheme(prefersDark ? 'dark' : 'light');
    this.setDirection(prefersRTL ? 'rtl' : 'ltr');
  }
}

// Add RTL-specific styles
const rtlStyles = document.createElement('style');
rtlStyles.textContent = `
  /* RTL Specific Styles */
  [dir="rtl"] .sidebar {
    border-radius: var(--radius-xl);
  }
  
  [dir="rtl"] .nav-item.active::before {
    right: 0;
    left: auto;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  
  [dir="rtl"] .table th,
  [dir="rtl"] .table td {
    text-align: right;
  }
  
  [dir="rtl"] .toast-container {
    right: var(--space-6);
    left: auto;
  }
  
  [dir="rtl"] .toast {
    text-align: right;
  }
  
  [dir="rtl"] .btn {
    flex-direction: row-reverse;
  }
  
  [dir="rtl"] .brand {
    flex-direction: row-reverse;
  }
  
  [dir="rtl"] .tools {
    flex-direction: row-reverse;
  }
  
  /* LTR Specific Styles */
  [dir="ltr"] .sidebar {
    border-radius: var(--radius-xl);
  }
  
  [dir="ltr"] .nav-item.active::before {
    left: 0;
    right: auto;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  }
  
  [dir="ltr"] .table th,
  [dir="ltr"] .table td {
    text-align: left;
  }
  
  [dir="ltr"] .toast-container {
    left: var(--space-6);
    right: auto;
  }
  
  [dir="ltr"] .toast {
    text-align: left;
  }
  
  [dir="ltr"] .btn {
    flex-direction: row;
  }
  
  [dir="ltr"] .brand {
    flex-direction: row;
  }
  
  [dir="ltr"] .tools {
    flex-direction: row;
  }
  
  /* Responsive adjustments for RTL */
  @media (max-width: 768px) {
    [dir="rtl"] .toast-container {
      right: var(--space-4);
      left: var(--space-4);
    }
    
    [dir="ltr"] .toast-container {
      left: var(--space-4);
      right: var(--space-4);
    }
  }
`;
document.head.appendChild(rtlStyles);

// Create global instance
window.theme = new ThemeSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSystem;
}