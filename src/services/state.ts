import type { AppState, UIState, Settings, Customer, Unit, Contract, Safe, Installment, Voucher, Partner, Broker } from '../types/index.js';
import { api } from './api.js';

// State management class
export class StateManager {
    private static instance: StateManager;
    private state: AppState;
    private uiState: UIState;
    private historyStack: any[] = [];
    private historyIndex: number = -1;
    private listeners: Set<() => void> = new Set();

    private constructor() {
        this.state = this.getInitialState();
        this.uiState = this.getInitialUIState();
    }

    static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }

    private getInitialState(): AppState {
        return {
            customers: [],
            units: [],
            partners: [],
            unitPartners: [],
            contracts: [],
            installments: [],
            partnerDebts: [],
            safes: [],
            transfers: [],
            auditLog: [],
            vouchers: [],
            brokerDues: [],
            brokers: [],
            partnerGroups: [],
            settings: { key: 'main', theme: 'dark', font: 16, pass: null },
            keyval: [],
            locked: false
        };
    }

    private getInitialUIState(): UIState {
        return {
            currentView: 'dash',
            currentParam: null,
            loading: false,
            error: null,
            notification: {
                type: 'info',
                message: '',
                show: false
            }
        };
    }

    // Getters
    getState(): AppState {
        return { ...this.state };
    }

    getUIState(): UIState {
        return { ...this.uiState };
    }

    // State setters
    setState(newState: Partial<AppState>): void {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    setUIState(newUIState: Partial<UIState>): void {
        this.uiState = { ...this.uiState, ...newUIState };
        this.notifyListeners();
    }

    // Specific state updates
    updateCollection<T>(collectionName: keyof AppState, items: T[]): void {
        this.setState({ [collectionName]: items } as Partial<AppState>);
    }

    addItem<T>(collectionName: keyof AppState, item: T): void {
        const currentItems = this.state[collectionName] as T[];
        this.updateCollection(collectionName, [...currentItems, item]);
    }

    updateItem<T>(collectionName: keyof AppState, item: T, idField: keyof T = 'id' as keyof T): void {
        const currentItems = this.state[collectionName] as T[];
        const updatedItems = currentItems.map(existingItem => 
            (existingItem as any)[idField] === (item as any)[idField] ? item : existingItem
        );
        this.updateCollection(collectionName, updatedItems);
    }

    removeItem<T>(collectionName: keyof AppState, itemId: string, idField: keyof T = 'id' as keyof T): void {
        const currentItems = this.state[collectionName] as T[];
        const filteredItems = currentItems.filter(item => (item as any)[idField] !== itemId);
        this.updateCollection(collectionName, filteredItems);
    }

    // History management
    saveToHistory(): void {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
        this.historyStack.push(JSON.parse(JSON.stringify(this.state)));
        this.historyIndex++;
    }

    undo(): boolean {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.state = JSON.parse(JSON.stringify(this.historyStack[this.historyIndex]));
            this.notifyListeners();
            return true;
        }
        return false;
    }

    redo(): boolean {
        if (this.historyIndex < this.historyStack.length - 1) {
            this.historyIndex++;
            this.state = JSON.parse(JSON.stringify(this.historyStack[this.historyIndex]));
            this.notifyListeners();
            return true;
        }
        return false;
    }

    canUndo(): boolean {
        return this.historyIndex > 0;
    }

    canRedo(): boolean {
        return this.historyIndex < this.historyStack.length - 1;
    }

    // Data loading
    async loadStateFromAPI(): Promise<AppState> {
        try {
            this.setUIState({ loading: true, error: null });

            const OBJECT_STORES = [
                'customers', 'units', 'partners', 'unitPartners', 'contracts', 'installments',
                'partnerDebts', 'safes', 'transfers', 'auditLog', 'vouchers', 'brokerDues',
                'brokers', 'partnerGroups', 'settings', 'keyval'
            ];

            const promises = OBJECT_STORES.map(storeName =>
                api.get(storeName).catch(error => {
                    console.error(`Failed to load data for ${storeName}:`, error);
                    return [];
                })
            );

            const results = await Promise.all(promises);
            
            const newState: Partial<AppState> = {};
            OBJECT_STORES.forEach((storeName, index) => {
                if (storeName !== 'settings' && storeName !== 'keyval') {
                    (newState as any)[storeName] = results[index] || [];
                } else {
                    (newState as any)[storeName] = results[index];
                }
            });

            // Ensure settings has proper structure
            if (!newState.settings || typeof newState.settings !== 'object') {
                newState.settings = { key: 'main', theme: 'dark', font: 16, pass: null };
            }

            // Ensure locked state
            if (typeof newState.locked !== 'boolean') {
                newState.locked = false;
            }

            // Create main safe if none exists
            if (!newState.safes || newState.safes.length === 0) {
                const newSafe = { 
                    id: this.generateId('S'), 
                    name: 'الخزنة الرئيسية', 
                    balance: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                try {
                    await api.put('safes', newSafe);
                    newState.safes = [newSafe];
                } catch (error) {
                    console.error("Failed to create initial safe:", error);
                    throw new Error("Failed to create initial safe: " + (error as Error).message);
                }
            }

            this.setState(newState as AppState);
            this.setUIState({ loading: false });
            
            return this.state;
        } catch (error) {
            this.setUIState({ 
                loading: false, 
                error: error instanceof Error ? error.message : 'Unknown error occurred' 
            });
            throw error;
        }
    }

    // Utility functions
    generateId(prefix: string): string {
        return prefix + '_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Event listeners
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    // Settings management
    async updateSettings(settings: Partial<Settings>): Promise<void> {
        const newSettings = { ...this.state.settings, ...settings };
        try {
            await api.put('settings', newSettings);
            this.setState({ settings: newSettings });
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    }

    // Lock management
    async setLock(password: string | null): Promise<void> {
        const newSettings = { ...this.state.settings, pass: password };
        try {
            await api.put('settings', newSettings);
            this.setState({ 
                settings: newSettings,
                locked: password !== null 
            });
        } catch (error) {
            console.error('Failed to update lock settings:', error);
            throw error;
        }
    }

    checkLock(): boolean {
        return this.state.locked;
    }

    // Notification management
    showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
        this.setUIState({
            notification: {
                type,
                message,
                show: true
            }
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.setUIState({
                notification: {
                    type: 'info',
                    message: '',
                    show: false
                }
            });
        }, 5000);
    }

    hideNotification(): void {
        this.setUIState({
            notification: {
                type: 'info',
                message: '',
                show: false
            }
        });
    }
}

// Export singleton instance
export const stateManager = StateManager.getInstance();