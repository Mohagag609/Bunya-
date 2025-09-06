/* Fix for slow scrolling and page navigation issues */

// 1. Optimize scroll performance
function optimizeScrollPerformance() {
    // Remove existing scroll listeners
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('scroll', handleScroll);
    
    // Add optimized scroll listener
    const throttledScroll = throttle(handleScroll, 16); // ~60fps
    window.addEventListener('scroll', throttledScroll, { passive: true });
    document.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Optimize scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.scrollBehavior = 'smooth';
}

// 2. Handle scroll with performance optimization
function handleScroll(e) {
    // Use requestAnimationFrame for smooth scrolling
    if (!window.scrollAnimationFrame) {
        window.scrollAnimationFrame = true;
        requestAnimationFrame(() => {
            processScroll();
            window.scrollAnimationFrame = false;
        });
    }
}

// 3. Process scroll events efficiently
function processScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Update scroll position indicators
    updateScrollIndicators(scrollTop, scrollLeft);
    
    // Handle scroll-based animations
    handleScrollAnimations(scrollTop);
    
    // Update navigation state
    updateNavigationState(scrollTop);
}

// 4. Update scroll indicators
function updateScrollIndicators(scrollTop, scrollLeft) {
    // Update scroll position in UI if needed
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.textContent = `Y: ${Math.round(scrollTop)}, X: ${Math.round(scrollLeft)}`;
    }
}

// 5. Handle scroll-based animations
function handleScrollAnimations(scrollTop) {
    // Optimize animations based on scroll position
    const animatedElements = document.querySelectorAll('[data-scroll-animate]');
    
    animatedElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            element.classList.add('scroll-visible');
        } else {
            element.classList.remove('scroll-visible');
        }
    });
}

// 6. Update navigation state
function updateNavigationState(scrollTop) {
    // Update active navigation based on scroll position
    const sections = document.querySelectorAll('section[id], div[id]');
    let activeSection = null;
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom > 100) {
            activeSection = section.id;
        }
    });
    
    if (activeSection) {
        updateActiveNavigation(activeSection);
    }
}

// 7. Update active navigation
function updateActiveNavigation(activeId) {
    // Remove active class from all navigation items
    const navItems = document.querySelectorAll('.nav-item, .tab, [data-nav]');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current navigation item
    const activeNavItem = document.querySelector(`[data-nav="${activeId}"], .nav-item[href="#${activeId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// 8. Optimize page navigation
function optimizePageNavigation() {
    // Find all navigation links
    const navLinks = document.querySelectorAll('a[href^="#"], .nav-link, .tab-link');
    
    navLinks.forEach(link => {
        // Remove existing click handlers
        link.removeEventListener('click', handleNavigationClick);
        
        // Add optimized click handler
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleNavigationClick(e);
        });
    });
}

// 9. Handle navigation clicks
function handleNavigationClick(e) {
    const link = e.currentTarget;
    const targetId = link.getAttribute('href') || link.getAttribute('data-target');
    
    if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            // Show loading state
            showNavigationLoading();
            
            // Use requestAnimationFrame for smooth navigation
            requestAnimationFrame(() => {
                navigateToElement(targetElement);
                hideNavigationLoading();
            });
        }
    }
}

// 10. Navigate to element with smooth scrolling
function navigateToElement(element) {
    // Calculate target position
    const targetPosition = element.offsetTop - 80; // Account for header
    
    // Smooth scroll to target
    smoothScrollTo(targetPosition, 500); // 500ms duration
    
    // Update active navigation
    const elementId = element.id;
    if (elementId) {
        updateActiveNavigation(elementId);
    }
}

// 11. Smooth scroll implementation
function smoothScrollTo(targetPosition, duration) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Easing function for smooth animation
        const ease = easeInOutCubic(progress);
        window.scrollTo(0, startPosition + distance * ease);
        
        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// 12. Easing function for smooth animation
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

// 13. Show navigation loading
function showNavigationLoading() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'nav-loading';
    loadingOverlay.style.cssText = `
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
    
    document.body.appendChild(loadingOverlay);
    
    // Fade in
    requestAnimationFrame(() => {
        loadingOverlay.style.opacity = '1';
    });
}

// 14. Hide navigation loading
function hideNavigationLoading() {
    const loadingOverlay = document.getElementById('nav-loading');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.remove();
        }, 200);
    }
}

// 15. Optimize tab switching
function optimizeTabSwitching() {
    const tabs = document.querySelectorAll('.tab, .nav-tab, [data-tab]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            handleTabSwitch(e);
        });
    });
}

// 16. Handle tab switching
function handleTabSwitch(e) {
    const tab = e.currentTarget;
    const targetId = tab.getAttribute('data-tab') || tab.getAttribute('href');
    
    if (targetId) {
        // Show loading state
        showTabLoading();
        
        // Use requestAnimationFrame for smooth switching
        requestAnimationFrame(() => {
            switchToTab(targetId);
            hideTabLoading();
        });
    }
}

// 17. Switch to tab
function switchToTab(targetId) {
    // Hide all tab contents
    const allContents = document.querySelectorAll('.tab-content, [data-tab-content]');
    allContents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Show target tab content
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
}

// 18. Show tab loading
function showTabLoading() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'tab-loading';
    loadingIndicator.style.cssText = `
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
    
    loadingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid var(--line); border-top: 2px solid var(--brand); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>جاري التحميل...</span>
        </div>
    `;
    
    document.body.appendChild(loadingIndicator);
    
    // Fade in
    requestAnimationFrame(() => {
        loadingIndicator.style.opacity = '1';
    });
}

// 19. Hide tab loading
function hideTabLoading() {
    const loadingIndicator = document.getElementById('tab-loading');
    if (loadingIndicator) {
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.remove();
        }, 200);
    }
}

// 20. Optimize page transitions
function optimizePageTransitions() {
    // Add CSS for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
        /* Smooth page transitions */
        * {
            transition: none !important;
        }
        
        .page-transition {
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        .page-enter {
            opacity: 0;
            transform: translateX(20px);
        }
        
        .page-enter-active {
            opacity: 1;
            transform: translateX(0);
        }
        
        .page-exit {
            opacity: 1;
            transform: translateX(0);
        }
        
        .page-exit-active {
            opacity: 0;
            transform: translateX(-20px);
        }
        
        /* Optimize scroll performance */
        .scroll-container {
            will-change: transform;
            transform: translateZ(0);
        }
        
        /* Optimize tab switching */
        .tab-content {
            will-change: opacity, transform;
            transform: translateZ(0);
        }
        
        /* Loading animations */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
}

// 21. Throttle function for scroll events
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
    }
}

// 22. Debounce function for resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 23. Optimize window resize
function optimizeWindowResize() {
    const debouncedResize = debounce(handleWindowResize, 250);
    window.addEventListener('resize', debouncedResize);
}

// 24. Handle window resize
function handleWindowResize() {
    // Recalculate layout on resize
    requestAnimationFrame(() => {
        // Update any layout-dependent elements
        updateLayout();
    });
}

// 25. Update layout
function updateLayout() {
    // Update any elements that depend on window size
    const elements = document.querySelectorAll('[data-responsive]');
    elements.forEach(element => {
        // Update responsive elements
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--element-width', `${rect.width}px`);
        element.style.setProperty('--element-height', `${rect.height}px`);
    });
}

// 26. Initialize all optimizations
function initializeScrollNavigationOptimizations() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeScrollNavigationOptimizations, 100);
        });
        return;
    }
    
    // Apply optimizations
    optimizeScrollPerformance();
    optimizePageNavigation();
    optimizeTabSwitching();
    optimizePageTransitions();
    optimizeWindowResize();
    
    console.log('Scroll and navigation optimizations applied successfully!');
}

// 27. Add scroll to top functionality
function addScrollToTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scroll-to-top';
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.style.cssText = `
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
    
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.transform = 'translateY(100px)';
            setTimeout(() => {
                if (scrollToTopBtn.style.opacity === '0') {
                    scrollToTopBtn.style.display = 'none';
                }
            }, 300);
        }
    }, 100));
    
    // Scroll to top on click
    scrollToTopBtn.addEventListener('click', () => {
        smoothScrollTo(0, 500);
    });
}

// Initialize optimizations
initializeScrollNavigationOptimizations();
addScrollToTop();

// Export functions for global use
window.optimizeScrollPerformance = optimizeScrollPerformance;
window.optimizePageNavigation = optimizePageNavigation;
window.optimizeTabSwitching = optimizeTabSwitching;
window.smoothScrollTo = smoothScrollTo;