export interface NotificationProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    closable?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export class Notification {
    private static container: HTMLElement | null = null;
    private static notifications: Map<string, HTMLElement> = new Map();
    private static counter = 0;

    static show(props: NotificationProps): string {
        const id = `notification-${++this.counter}`;
        
        // Create container if it doesn't exist
        if (!this.container) {
            this.createContainer();
        }

        const notification = this.createNotification(id, props);
        this.container!.appendChild(notification);
        this.notifications.set(id, notification);

        // Auto-remove after duration
        if (props.duration !== 0) {
            setTimeout(() => {
                this.remove(id);
            }, props.duration || 5000);
        }

        return id;
    }

    static remove(id: string): void {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.add('notification-removing');
            setTimeout(() => {
                notification.remove();
                this.notifications.delete(id);
            }, 300);
        }
    }

    static removeAll(): void {
        this.notifications.forEach((_, id) => this.remove(id));
    }

    private static createContainer(): void {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    private static createNotification(id: string, props: NotificationProps): HTMLElement {
        const notification = document.createElement('div');
        notification.className = `notification notification-${props.type}`;
        notification.id = id;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(props.type)};
            color: white;
            padding: 16px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            pointer-events: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;

        const icon = this.getIcon(props.type);
        const closeButton = props.closable !== false ? 
            `<button class="notification-close" onclick="Notification.remove('${id}')" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                float: left;
                margin-left: 10px;
            ">×</button>` : '';

        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 20px; margin-left: 8px;">${icon}</span>
                <span style="flex: 1;">${props.message}</span>
                ${closeButton}
            </div>
        `;

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        return notification;
    }

    private static getIcon(type: string): string {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type as keyof typeof icons] || 'ℹ️';
    }

    private static getBackgroundColor(type: string): string {
        const colors = {
            success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };
        return colors[type as keyof typeof colors] || colors.info;
    }
}

// Convenience functions
export const showNotification = (message: string, type: NotificationProps['type'] = 'info', duration?: number) => {
    return Notification.show({ message, type, duration });
};

export const showSuccess = (message: string, duration?: number) => {
    return Notification.show({ message, type: 'success', duration });
};

export const showError = (message: string, duration?: number) => {
    return Notification.show({ message, type: 'error', duration });
};

export const showWarning = (message: string, duration?: number) => {
    return Notification.show({ message, type: 'warning', duration });
};

export const showInfo = (message: string, duration?: number) => {
    return Notification.show({ message, type: 'info', duration });
};