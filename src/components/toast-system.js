/* ===== TOAST NOTIFICATION SYSTEM ===== */

class ToastSystem {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, options = {}) {
    const {
      type = 'info',
      title = '',
      duration = 5000,
      closable = true,
      position = 'top-right'
    } = options;

    const toastId = this.generateId();
    const toast = this.createToast(toastId, message, { type, title, closable });
    
    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toastId);
      }, duration);
    }

    return toastId;
  }

  createToast(id, message, options) {
    const { type, title, closable } = options;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('data-toast-id', id);

    const icon = this.getIcon(type);
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      ${closable ? '<button class="toast-close" aria-label="إغلاق">&times;</button>' : ''}
    `;

    // Add close functionality
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(id));
    }

    // Add click to dismiss
    toast.addEventListener('click', (e) => {
      if (e.target === toast || e.target.classList.contains('toast-content')) {
        this.remove(id);
      }
    });

    return toast;
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  remove(id) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.style.animation = 'toast-slide-out 0.3s ease-in forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.toasts.delete(id);
      }, 300);
    }
  }

  removeAll() {
    this.toasts.forEach((toast, id) => {
      this.remove(id);
    });
  }

  generateId() {
    return 'toast-' + Math.random().toString(36).substr(2, 9);
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  }

  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }
}

// Add slide-out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes toast-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .toast-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
`;
document.head.appendChild(style);

// Create global instance
window.toast = new ToastSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastSystem;
}