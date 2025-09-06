/* Performance fixes for text input and installment generation */

// 1. Optimize text input performance
function optimizeTextInputs() {
    const textInputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
    
    textInputs.forEach(input => {
        // Remove default event listeners that might be slow
        input.removeEventListener('input', handleTextInput);
        input.removeEventListener('keyup', handleTextInput);
        
        // Add optimized debounced input handler
        const debouncedHandler = debounce((e) => {
            handleTextInput(e);
        }, 150); // Reduced from 300ms to 150ms
        
        input.addEventListener('input', debouncedHandler, { passive: true });
        input.addEventListener('keyup', debouncedHandler, { passive: true });
        
        // Add visual feedback for better UX
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--brand)';
            input.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
        });
        
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--line)';
            input.style.boxShadow = 'none';
        });
    });
}

// 2. Optimize installment generation
function optimizeInstallmentGeneration() {
    // Find all installment generation buttons
    const generateButtons = document.querySelectorAll('[onclick*="generate"], [onclick*="توليد"]');
    
    generateButtons.forEach(button => {
        // Remove existing onclick handlers
        const originalOnclick = button.getAttribute('onclick');
        button.removeAttribute('onclick');
        
        // Add optimized click handler
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleInstallmentGeneration(button, originalOnclick);
        });
    });
}

// 3. Handle installment generation with loading state
async function handleInstallmentGeneration(button, originalOnclick) {
    // Show loading state
    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    
    button.disabled = true;
    button.textContent = '⏳ جاري التوليد...';
    button.style.opacity = '0.7';
    button.style.cursor = 'not-allowed';
    
    // Disable all form inputs during generation
    const formInputs = document.querySelectorAll('input, select, textarea, button');
    formInputs.forEach(input => {
        if (input !== button) {
            input.disabled = true;
            input.style.opacity = '0.5';
        }
    });
    
    try {
        // Use requestIdleCallback for better performance
        await new Promise((resolve) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    // Execute original function
                    eval(originalOnclick);
                    resolve();
                }, { timeout: 1000 });
            } else {
                setTimeout(() => {
                    eval(originalOnclick);
                    resolve();
                }, 0);
            }
        });
        
        // Show success state briefly
        button.textContent = '✅ تم التوليد';
        button.style.background = 'var(--ok)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
        
    } catch (error) {
        console.error('Error generating installments:', error);
        button.textContent = '❌ خطأ في التوليد';
        button.style.background = 'var(--warn)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } finally {
        // Restore button state
        button.disabled = originalDisabled;
        button.style.opacity = '';
        button.style.cursor = '';
        
        // Re-enable all form inputs
        formInputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '';
        });
    }
}

// 4. Optimize contract saving
function optimizeContractSaving() {
    const saveButtons = document.querySelectorAll('[onclick*="save"], [onclick*="حفظ"]');
    
    saveButtons.forEach(button => {
        const originalOnclick = button.getAttribute('onclick');
        button.removeAttribute('onclick');
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleContractSaving(button, originalOnclick);
        });
    });
}

// 5. Handle contract saving with loading state
async function handleContractSaving(button, originalOnclick) {
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = '💾 جاري الحفظ...';
    button.style.opacity = '0.7';
    
    try {
        // Use requestIdleCallback for better performance
        await new Promise((resolve) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    eval(originalOnclick);
                    resolve();
                }, { timeout: 2000 });
            } else {
                setTimeout(() => {
                    eval(originalOnclick);
                    resolve();
                }, 0);
            }
        });
        
        // Show success state
        button.textContent = '✅ تم الحفظ';
        button.style.background = 'var(--ok)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving contract:', error);
        button.textContent = '❌ خطأ في الحفظ';
        button.style.background = 'var(--warn)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } finally {
        button.disabled = false;
        button.style.opacity = '';
    }
}

// 6. Optimize form validation
function optimizeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Remove existing event listeners
        form.removeEventListener('submit', handleFormSubmit);
        
        // Add optimized submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleFormSubmit(e);
        });
    });
}

// 7. Handle form submission with loading state
async function handleFormSubmit(e) {
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    
    if (submitButton) {
        const originalText = submitButton.textContent || submitButton.value;
        
        submitButton.disabled = true;
        submitButton.textContent = '⏳ جاري المعالجة...';
        submitButton.style.opacity = '0.7';
    }
    
    try {
        // Use requestIdleCallback for better performance
        await new Promise((resolve) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    // Process form data
                    processFormData(form);
                    resolve();
                }, { timeout: 1000 });
            } else {
                setTimeout(() => {
                    processFormData(form);
                    resolve();
                }, 0);
            }
        });
        
        if (submitButton) {
            submitButton.textContent = '✅ تم';
            submitButton.style.background = 'var(--ok)';
            
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.style.background = '';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Error processing form:', error);
        
        if (submitButton) {
            submitButton.textContent = '❌ خطأ';
            submitButton.style.background = 'var(--warn)';
            
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.style.background = '';
            }, 2000);
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '';
        }
    }
}

// 8. Process form data efficiently
function processFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Process data here
    console.log('Form data processed:', data);
    
    // Trigger any necessary updates
    if (typeof updateFormData === 'function') {
        updateFormData(data);
    }
}

// 9. Add loading overlay for heavy operations
function showLoadingOverlay(message = 'جاري المعالجة...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-size: 18px;
        font-weight: 500;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <div>${message}</div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 10. Optimize heavy operations
function optimizeHeavyOperations() {
    // Find all heavy operation buttons
    const heavyButtons = document.querySelectorAll('[onclick*="generate"], [onclick*="توليد"], [onclick*="save"], [onclick*="حفظ"]');
    
    heavyButtons.forEach(button => {
        const originalOnclick = button.getAttribute('onclick');
        button.removeAttribute('onclick');
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Show loading overlay for heavy operations
            const overlay = showLoadingOverlay('جاري المعالجة...');
            
            try {
                await new Promise((resolve) => {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(() => {
                            eval(originalOnclick);
                            resolve();
                        }, { timeout: 5000 });
                    } else {
                        setTimeout(() => {
                            eval(originalOnclick);
                            resolve();
                        }, 0);
                    }
                });
            } finally {
                hideLoadingOverlay();
            }
        });
    });
}

// 11. Initialize all optimizations
function initializePerformanceOptimizations() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializePerformanceOptimizations, 100);
        });
        return;
    }
    
    // Apply optimizations
    optimizeTextInputs();
    optimizeInstallmentGeneration();
    optimizeContractSaving();
    optimizeFormValidation();
    optimizeHeavyOperations();
    
    console.log('Performance optimizations applied successfully!');
}

// 12. Debounce function for better performance
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

// 13. Throttle function for scroll events
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

// Initialize optimizations
initializePerformanceOptimizations();

// Export functions for global use
window.optimizeTextInputs = optimizeTextInputs;
window.optimizeInstallmentGeneration = optimizeInstallmentGeneration;
window.optimizeContractSaving = optimizeContractSaving;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;