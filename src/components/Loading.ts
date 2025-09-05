export interface LoadingProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    overlay?: boolean;
    color?: string;
}

export class Loading {
    private static overlay: HTMLElement | null = null;

    static show(props: LoadingProps = {}): void {
        if (this.overlay) {
            this.hide();
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.style.cssText = `
            position: ${props.overlay !== false ? 'fixed' : 'relative'};
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${props.overlay !== false ? 'rgba(0, 0, 0, 0.8)' : 'transparent'};
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            flex-direction: column;
        `;

        const spinner = this.createSpinner(props);
        this.overlay.appendChild(spinner);

        if (props.message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            messageEl.textContent = props.message;
            messageEl.style.cssText = `
                color: white;
                margin-top: 16px;
                font-size: 16px;
                text-align: center;
            `;
            this.overlay.appendChild(messageEl);
        }

        document.body.appendChild(this.overlay);
    }

    static hide(): void {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    static showInContainer(container: HTMLElement, props: LoadingProps = {}): void {
        container.innerHTML = '';
        
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 40px;
            min-height: 200px;
        `;

        const spinner = this.createSpinner(props);
        loadingContainer.appendChild(spinner);

        if (props.message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            messageEl.textContent = props.message;
            messageEl.style.cssText = `
                color: var(--text-color, #333);
                margin-top: 16px;
                font-size: 16px;
                text-align: center;
            `;
            loadingContainer.appendChild(messageEl);
        }

        container.appendChild(loadingContainer);
    }

    private static createSpinner(props: LoadingProps): HTMLElement {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        const size = props.size || 'medium';
        const sizes = {
            small: '20px',
            medium: '40px',
            large: '60px'
        };

        const spinnerSize = sizes[size];
        const color = props.color || '#667eea';

        spinner.style.cssText = `
            width: ${spinnerSize};
            height: ${spinnerSize};
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid ${color};
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        // Add CSS animation if not already added
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-overlay {
                    backdrop-filter: blur(2px);
                }
                
                .spinner {
                    will-change: transform;
                }
            `;
            document.head.appendChild(style);
        }

        return spinner;
    }
}

// Convenience functions
export const showLoading = (message?: string) => {
    Loading.show({ message });
};

export const hideLoading = () => {
    Loading.hide();
};

export const showLoadingInContainer = (container: HTMLElement, message?: string) => {
    Loading.showInContainer(container, { message });
};