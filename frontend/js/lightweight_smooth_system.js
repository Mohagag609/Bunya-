/* Lightweight and smooth system optimization */

// 1. Core performance utilities
const Performance = {
    // Throttle for scroll events
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
        }
    },

    // Debounce for input events
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Smooth scroll
    smoothScrollTo(targetPosition, duration = 300) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const ease = progress < 0.5 ? 4 * progress * progress * progress : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
};

// 2. Lightweight scroll optimization
const ScrollOptimizer = {
    init() {
        this.addScrollListener();
        this.addScrollToTop();
    },

    addScrollListener() {
        const throttledScroll = Performance.throttle(this.handleScroll, 16); // 60fps
        window.addEventListener('scroll', throttledScroll, { passive: true });
    },

    handleScroll() {
        if (!window.scrollProcessing) {
            window.scrollProcessing = true;
            requestAnimationFrame(() => {
                this.updateScrollIndicators();
                this.updateNavigationState();
                window.scrollProcessing = false;
            });
        }
    },

    updateScrollIndicators() {
        const scrollTop = window.pageYOffset;
        const indicators = document.querySelectorAll('.scroll-indicator');
        indicators.forEach(indicator => {
            indicator.textContent = `Y: ${Math.round(scrollTop)}`;
        });
    },

    updateNavigationState() {
        const scrollTop = window.pageYOffset;
        const sections = document.querySelectorAll('section[id], div[id]');
        let activeSection = null;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom > 100) {
                activeSection = section.id;
            }
        });
        
        if (activeSection) {
            this.updateActiveNavigation(activeSection);
        }
    },

    updateActiveNavigation(activeId) {
        const navItems = document.querySelectorAll('.nav-item, .tab, [data-nav]');
        navItems.forEach(item => item.classList.remove('active'));
        
        const activeNavItem = document.querySelector(`[data-nav="${activeId}"], .nav-item[href="#${activeId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    },

    addScrollToTop() {
        const btn = document.createElement('button');
        btn.id = 'scroll-to-top';
        btn.innerHTML = '↑';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--brand);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            box-shadow: var(--shadow);
            z-index: 1000;
            opacity: 0;
            transform: translateY(100px);
            transition: all 0.3s ease;
            display: none;
        `;
        
        document.body.appendChild(btn);
        
        window.addEventListener('scroll', Performance.throttle(() => {
            if (window.pageYOffset > 300) {
                btn.style.display = 'block';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            } else {
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(100px)';
                setTimeout(() => {
                    if (btn.style.opacity === '0') {
                        btn.style.display = 'none';
                    }
                }, 300);
            }
        }, 100));
        
        btn.addEventListener('click', () => Performance.smoothScrollTo(0, 500));
    }
};

// 3. Lightweight navigation optimization
const NavigationOptimizer = {
    init() {
        this.optimizeLinks();
    },

    optimizeLinks() {
        const links = document.querySelectorAll('a[href^="#"], .nav-link, .tab-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e);
            });
        });
    },

    handleNavigation(e) {
        const link = e.currentTarget;
        const targetId = link.getAttribute('href') || link.getAttribute('data-target');
        
        if (targetId && targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                this.showLoading();
                requestAnimationFrame(() => {
                    this.navigateToElement(targetElement);
                    this.hideLoading();
                });
            }
        }
    },

    navigateToElement(element) {
        const targetPosition = element.offsetTop - 80;
        Performance.smoothScrollTo(targetPosition, 400);
        
        const elementId = element.id;
        if (elementId) {
            ScrollOptimizer.updateActiveNavigation(elementId);
        }
    },

    showLoading() {
        const overlay = document.createElement('div');
        overlay.id = 'nav-loading';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.1);
            z-index: 9998;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = '1');
    },

    hideLoading() {
        const overlay = document.getElementById('nav-loading');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }
    }
};

// 4. Lightweight tab optimization
const TabOptimizer = {
    init() {
        this.optimizeTabs();
    },

    optimizeTabs() {
        const tabs = document.querySelectorAll('.tab, .nav-tab, [data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTabSwitch(e);
            });
        });
    },

    handleTabSwitch(e) {
        const tab = e.currentTarget;
        const targetId = tab.getAttribute('data-tab') || tab.getAttribute('href');
        
        if (targetId) {
            this.showTabLoading();
            requestAnimationFrame(() => {
                this.switchToTab(targetId);
                this.hideTabLoading();
            });
        }
    },

    switchToTab(targetId) {
        // Hide all contents
        const allContents = document.querySelectorAll('.tab-content, [data-tab-content]');
        allContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });
        
        // Show target content
        const targetContent = document.querySelector(`[data-tab-content="${targetId}"], #${targetId}`);
        if (targetContent) {
            targetContent.style.display = 'block';
            targetContent.classList.add('active');
        }
        
        // Update active tab
        const allTabs = document.querySelectorAll('.tab, .nav-tab, [data-tab]');
        allTabs.forEach(t => t.classList.remove('active'));
        
        const activeTab = document.querySelector(`[data-tab="${targetId}"], [href="#${targetId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    },

    showTabLoading() {
        const indicator = document.createElement('div');
        indicator.id = 'tab-loading';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card);
            padding: 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid var(--line); border-top: 2px solid var(--brand); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>جاري التحميل...</span>
            </div>
        `;
        
        document.body.appendChild(indicator);
        requestAnimationFrame(() => indicator.style.opacity = '1');
    },

    hideTabLoading() {
        const indicator = document.getElementById('tab-loading');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 200);
        }
    }
};

// 5. Lightweight input optimization
const InputOptimizer = {
    init() {
        this.optimizeInputs();
    },

    optimizeInputs() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
        inputs.forEach(input => {
            const debouncedHandler = Performance.debounce(this.handleInput, 150);
            input.addEventListener('input', debouncedHandler, { passive: true });
            input.addEventListener('keyup', debouncedHandler, { passive: true });
        });
    },

    handleInput(e) {
        // Handle input events efficiently
        const input = e.target;
        if (input.value.length > 0) {
            input.style.borderColor = 'var(--brand)';
        } else {
            input.style.borderColor = 'var(--line)';
        }
    }
};

// 6. Lightweight button optimization
const ButtonOptimizer = {
    init() {
        this.optimizeButtons();
    },

    optimizeButtons() {
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleButtonClick(e);
            });
        });
    },

    handleButtonClick(e) {
        const button = e.currentTarget;
        const originalText = button.textContent;
        
        // Show loading state
        button.disabled = true;
        button.textContent = '⏳ جاري المعالجة...';
        button.style.opacity = '0.7';
        
        // Simulate processing
        setTimeout(() => {
            button.textContent = '✅ تم';
            button.style.background = 'var(--ok)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                button.disabled = false;
                button.style.opacity = '';
            }, 1500);
        }, 1000);
    }
};

// 7. Lightweight CSS optimization
const CSSOptimizer = {
    init() {
        this.addOptimizedCSS();
    },

    addOptimizedCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Lightweight and smooth CSS */
            * {
                transition: none !important;
            }
            
            .smooth-transition {
                transition: all 0.2s ease;
            }
            
            .scroll-container {
                will-change: transform;
                transform: translateZ(0);
            }
            
            .tab-content {
                will-change: opacity, transform;
                transform: translateZ(0);
            }
            
            input, textarea, select {
                transition: border-color 0.1s ease, box-shadow 0.1s ease;
                will-change: border-color, box-shadow;
                transform: translateZ(0);
            }
            
            button {
                transition: all 0.1s ease;
                will-change: transform, background-color;
                transform: translateZ(0);
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 8. Main system initializer
const LightweightSystem = {
    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initialize(), 100);
            });
        } else {
            this.initialize();
        }
    },

    initialize() {
        // Initialize all optimizers
        ScrollOptimizer.init();
        NavigationOptimizer.init();
        TabOptimizer.init();
        InputOptimizer.init();
        ButtonOptimizer.init();
        CSSOptimizer.init();
        
        console.log('Lightweight and smooth system initialized!');
    }
};

// 9. Initialize the system
LightweightSystem.init();

// 10. Export for global use
window.LightweightSystem = LightweightSystem;
window.Performance = Performance;
window.ScrollOptimizer = ScrollOptimizer;
window.NavigationOptimizer = NavigationOptimizer;
window.TabOptimizer = TabOptimizer;
window.InputOptimizer = InputOptimizer;
window.ButtonOptimizer = ButtonOptimizer;