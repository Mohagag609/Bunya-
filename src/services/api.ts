import type { ApiResponse } from '../types/index.js';

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:8000/api`
    : 'https://estate-manager-backend-vwop.onrender.com/api';

// Error handling class
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public response?: Response
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Response handler with better error handling
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorData: any;
        try {
            const text = await response.text();
            if (text) {
                errorData = JSON.parse(text);
            } else {
                errorData = { error: 'Empty response from server' };
            }
        } catch {
            errorData = { 
                error: `Server error: ${response.status} ${response.statusText}` 
            };
        }
        
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new ApiError(errorMessage, response.status, response);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return {} as T;
}

// Generic API service class
export class ApiService {
    private static instance: ApiService;
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    // Generic GET request
    async get<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return handleResponse<T>(response);
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Generic PUT request (for upsert operations)
    async put<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return handleResponse<T>(response);
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Generic DELETE request
    async delete<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return handleResponse<T>(response);
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Batch operations
    async batchGet<T>(endpoints: string[]): Promise<T[]> {
        const promises = endpoints.map(endpoint => this.get<T>(endpoint));
        return Promise.all(promises);
    }
}

// Specific API methods for backward compatibility
export const api = ApiService.getInstance();

// Legacy function wrappers for backward compatibility
export async function getAll<T>(storeName: string): Promise<T[]> {
    return api.get<T[]>(storeName);
}

export async function put<T>(storeName: string, item: any): Promise<T> {
    const pkName = (storeName === 'settings' || storeName === 'keyval') ? 'key' : 'id';
    const itemId = item[pkName];

    if (!itemId) {
        throw new ApiError(`Item must have a primary key ('${pkName}') to be saved.`, 400);
    }

    return api.put<T>(`${storeName}/${itemId}`, item);
}

export async function deleteItem<T>(storeName: string, itemId: string): Promise<T> {
    return api.delete<T>(`${storeName}/${itemId}`);
}

export async function getKeyVal(key: string): Promise<any> {
    try {
        const result = await api.get<{ data: { value: any } }>(`keyval/${key}`);
        return result.data.value;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return undefined;
        }
        throw error;
    }
}

export async function setKeyVal(key: string, value: any): Promise<any> {
    return put('keyval', { key: key, value: value });
}

// Dummy function for backward compatibility
export function openDB(): Promise<void> {
    console.log("openDB is deprecated. The application now uses a backend API.");
    return Promise.resolve();
}