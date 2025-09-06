/* 🎨 نظام الانيميشن والتأثيرات البصرية المتقدمة */

/* ===== ANIMATION SYSTEM ===== */
class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.observers = new Map();
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupPageTransitions();
    }
    
    // Intersection Observer for scroll animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all elements with animation classes
        document.addEventListener('DOMContentLoaded', () => {
            const animatedElements = document.querySelectorAll('[data-animate]');
            animatedElements.forEach(el => this.intersectionObserver.observe(el));
        });
    }
    
    // Animate element based on data-animate attribute
    animateElement(element) {
        const animationType = element.dataset.animate;
        const delay = parseInt(element.dataset.delay) || 0;
        
        setTimeout(() => {
            element.classList.add('animate-in');
            
            // Add specific animation based on type
            switch (animationType) {
                case 'fade-up':
                    this.fadeUp(element);
                    break;
                case 'fade-in':
                    this.fadeIn(element);
                    break;
                case 'slide-left':
                    this.slideLeft(element);
                    break;
                case 'slide-right':
                    this.slideRight(element);
                    break;
                case 'scale-in':
                    this.scaleIn(element);
                    break;
                case 'bounce':
                    this.bounce(element);
                    break;
                case 'pulse':
                    this.pulse(element);
                    break;
            }
        }, delay);
    }
    
    // Animation methods
    fadeUp(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    fadeIn(element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }
    
    slideLeft(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-30px)';
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        });
    }
    
    slideRight(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(30px)';
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        });
    }
    
    scaleIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        });
    }
    
    bounce(element) {
        element.style.animation = 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }
    
    pulse(element) {
        element.style.animation = 'pulseIn 1s ease-in-out';
    }
    
    // Setup scroll-based animations
    setupScrollAnimations() {
        let ticking = false;
        
        const updateScrollAnimations = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('[data-parallax]');
            
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.parallax) || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }
    
    // Setup hover effects
    setupHoverEffects() {
        // Enhanced button hover effects
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.btn, .card, .panel')) {
                this.addHoverEffect(e.target);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.matches('.btn, .card, .panel')) {
                this.removeHoverEffect(e.target);
            }
        });
    }
    
    addHoverEffect(element) {
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.transform = 'translateY(-2px) scale(1.02)';
        element.style.boxShadow = 'var(--shadow-lg)';
    }
    
    removeHoverEffect(element) {
        element.style.transform = 'translateY(0) scale(1)';
        element.style.boxShadow = 'var(--shadow)';
    }
    
    // Setup page transitions
    setupPageTransitions() {
        // Add transition classes to main content
        const content = document.getElementById('view');
        if (content) {
            content.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }
    
    // Page transition methods
    showPageTransition() {
        const content = document.getElementById('view');
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px)';
        }
    }
    
    hidePageTransition() {
        const content = document.getElementById('view');
        if (content) {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }
    }
    
    // Add loading animation
    showLoadingAnimation(element) {
        const loader = document.createElement('div');
        loader.className = 'loading-animation';
        loader.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">جاري التحميل...</div>
        `;
        
        element.appendChild(loader);
        
        // Add CSS if not exists
        if (!document.getElementById('loading-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-animation-styles';
            style.textContent = `
                .loading-animation {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }
                .loading-text {
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return loader;
    }
    
    hideLoadingAnimation(loader) {
        if (loader && loader.parentNode) {
            loader.remove();
        }
    }
}

/* ===== PARTICLE SYSTEM ===== */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.createParticles();
        this.animate();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        this.canvas.style.opacity = '0.1';
        
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            this.ctx.fill();
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

/* ===== MODAL SYSTEM ===== */
class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal(e.target.dataset.modalId);
            }
        });
    }
    
    showModal(id, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.dataset.modalId = id;
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${options.title || 'Modal'}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${options.buttons || ''}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles if not exists
        if (!document.getElementById('modal-styles')) {
            this.addModalStyles();
        }
        
        document.body.appendChild(modal);
        this.modals.set(id, modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('modal-show');
        });
        
        // Close button functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(id);
        });
        
        return modal;
    }
    
    closeModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.classList.remove('modal-show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                this.modals.delete(id);
            }, 300);
        }
    }
    
    closeAllModals() {
        this.modals.forEach((modal, id) => {
            this.closeModal(id);
        });
    }
    
    addModalStyles() {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(10px);
            }
            .modal-backdrop.modal-show {
                opacity: 1;
            }
            .modal-container {
                background: var(--card);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            .modal-backdrop.modal-show .modal-container {
                transform: scale(1);
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-lg);
                border-bottom: 1px solid var(--line);
            }
            .modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }
            .modal-close {
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
            .modal-close:hover {
                background: var(--line);
                color: var(--ink);
            }
            .modal-body {
                padding: var(--space-lg);
                max-height: 60vh;
                overflow-y: auto;
            }
            .modal-footer {
                padding: var(--space-lg);
                border-top: 1px solid var(--line);
                display: flex;
                gap: var(--space-md);
                justify-content: flex-end;
            }
        `;
        document.head.appendChild(style);
    }
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animation system
    window.animationSystem = new AnimationSystem();
    
    // Initialize particle system (optional)
    if (window.innerWidth > 768) {
        window.particleSystem = new ParticleSystem();
    }
    
    // Initialize modal system
    window.modalSystem = new ModalSystem();
    
    // Add animation classes to elements
    const cards = document.querySelectorAll('.card, .panel');
    cards.forEach((card, index) => {
        card.setAttribute('data-animate', 'fade-up');
        card.setAttribute('data-delay', index * 100);
    });
    
    // Add parallax effect to header
    const header = document.querySelector('.header');
    if (header) {
        header.setAttribute('data-parallax', '0.5');
    }
});

/* ===== EXPORT ===== */
window.AnimationSystem = AnimationSystem;
window.ParticleSystem = ParticleSystem;
window.ModalSystem = ModalSystem;