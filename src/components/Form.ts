import type { Customer, Unit, Contract, Safe, Partner, Broker } from '../types/index.js';
import { validateEmail, validatePhone, validateRequired } from '../utils/helpers.js';

export interface FormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    validation?: (value: any) => string | null;
    disabled?: boolean;
    readonly?: boolean;
}

export interface FormProps<T> {
    title: string;
    fields: FormField[];
    data: Partial<T>;
    onSubmit: (data: T) => void | Promise<void>;
    onCancel?: () => void;
    submitText?: string;
    cancelText?: string;
    loading?: boolean;
    className?: string;
}

export class Form<T extends Record<string, any>> {
    private props: FormProps<T>;
    private container: HTMLElement;
    private formData: Partial<T> = {};
    private errors: Record<string, string> = {};

    constructor(container: HTMLElement, props: FormProps<T>) {
        this.container = container;
        this.props = props;
        this.formData = { ...props.data };
        this.render();
    }

    updateProps(newProps: Partial<FormProps<T>>): void {
        this.props = { ...this.props, ...newProps };
        this.formData = { ...this.props.data };
        this.errors = {};
        this.render();
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="form-container ${this.props.className || ''}">
                <div class="form-header">
                    <h2>${this.props.title}</h2>
                </div>
                <form class="form" novalidate>
                    ${this.props.fields.map(field => this.renderField(field)).join('')}
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" ${this.props.loading ? 'disabled' : ''}>
                            ${this.props.loading ? 'جاري الحفظ...' : (this.props.submitText || 'حفظ')}
                        </button>
                        ${this.props.onCancel ? `
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.form').dispatchEvent(new CustomEvent('cancel'))">
                                ${this.props.cancelText || 'إلغاء'}
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        `;

        this.attachEventListeners();
    }

    private renderField(field: FormField): string {
        const error = this.errors[field.key];
        const value = this.formData[field.key] || '';

        return `
            <div class="form-field ${field.required ? 'required' : ''} ${error ? 'error' : ''}">
                <label for="${field.key}">${field.label}</label>
                ${this.renderInput(field, value)}
                ${error ? `<span class="error-message">${error}</span>` : ''}
            </div>
        `;
    }

    private renderInput(field: FormField, value: any): string {
        const commonAttrs = `
            id="${field.key}"
            name="${field.key}"
            ${field.required ? 'required' : ''}
            ${field.disabled ? 'disabled' : ''}
            ${field.readonly ? 'readonly' : ''}
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        `;

        switch (field.type) {
            case 'textarea':
                return `<textarea ${commonAttrs}>${value}</textarea>`;

            case 'select':
                const options = field.options?.map(opt => 
                    `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('') || '';
                return `<select ${commonAttrs}>${options}</select>`;

            case 'checkbox':
                return `
                    <label class="checkbox-label">
                        <input type="checkbox" ${commonAttrs} ${value ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                `;

            default:
                return `<input type="${field.type}" ${commonAttrs} value="${value}">`;
        }
    }

    private attachEventListeners(): void {
        const form = this.container.querySelector('.form') as HTMLFormElement;
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Cancel event
        form.addEventListener('cancel', () => {
            this.props.onCancel?.();
        });

        // Real-time validation
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input as HTMLInputElement);
            });

            input.addEventListener('input', () => {
                this.updateFormData(input as HTMLInputElement);
                // Clear error on input
                if (this.errors[(input as HTMLInputElement).name]) {
                    delete this.errors[(input as HTMLInputElement).name];
                    this.render();
                }
            });
        });
    }

    private updateFormData(input: HTMLInputElement): void {
        const { name, type, checked, value } = input;
        
        if (type === 'checkbox') {
            (this.formData as any)[name] = checked;
        } else if (type === 'number') {
            (this.formData as any)[name] = value ? Number(value) : null;
        } else {
            (this.formData as any)[name] = value;
        }
    }

    private validateField(input: HTMLInputElement): boolean {
        const { name, type, value, checked } = input;
        const field = this.props.fields.find(f => f.key === name);
        if (!field) return true;

        let error: string | null = null;

        // Required validation
        if (field.required) {
            if (type === 'checkbox' && !checked) {
                error = 'هذا الحقل مطلوب';
            } else if (type !== 'checkbox' && !value.trim()) {
                error = 'هذا الحقل مطلوب';
            }
        }

        // Type-specific validation
        if (!error && value) {
            switch (type) {
                case 'email':
                    if (!validateEmail(value)) {
                        error = 'البريد الإلكتروني غير صحيح';
                    }
                    break;
                case 'tel':
                    if (!validatePhone(value)) {
                        error = 'رقم الهاتف غير صحيح';
                    }
                    break;
                case 'number':
                    if (isNaN(Number(value))) {
                        error = 'يجب أن يكون رقماً';
                    }
                    break;
            }
        }

        // Custom validation
        if (!error && field.validation) {
            const fieldValue = type === 'checkbox' ? checked : value;
            error = field.validation(fieldValue);
        }

        if (error) {
            this.errors[name] = error;
        } else {
            delete this.errors[name];
        }

        this.render();
        return !error;
    }

    private async handleSubmit(): Promise<void> {
        // Validate all fields
        const form = this.container.querySelector('.form') as HTMLFormElement;
        const inputs = form.querySelectorAll('input, select, textarea') as NodeListOf<HTMLInputElement>;
        
        let isValid = true;
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            return;
        }

        try {
            await this.props.onSubmit(this.formData as T);
        } catch (error) {
            console.error('Form submission error:', error);
            // Handle error (could show notification)
        }
    }

    // Public methods
    getData(): Partial<T> {
        return { ...this.formData };
    }

    setData(data: Partial<T>): void {
        this.formData = { ...data };
        this.errors = {};
        this.render();
    }

    setError(field: string, message: string): void {
        this.errors[field] = message;
        this.render();
    }

    clearErrors(): void {
        this.errors = {};
        this.render();
    }

    isValid(): boolean {
        return Object.keys(this.errors).length === 0;
    }
}

// Predefined form configurations
export const formConfigs = {
    customer: [
        { key: 'name', label: 'الاسم', type: 'text' as const, required: true },
        { key: 'phone', label: 'الهاتف', type: 'tel' as const, required: true },
        { key: 'email', label: 'البريد الإلكتروني', type: 'email' as const },
        { key: 'address', label: 'العنوان', type: 'textarea' as const },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' as const }
    ] as FormField[],

    unit: [
        { key: 'name', label: 'اسم الوحدة', type: 'text' as const, required: true },
        { key: 'building', label: 'المبنى', type: 'text' as const, required: true },
        { key: 'floor', label: 'الطابق', type: 'number' as const, required: true },
        { key: 'area', label: 'المساحة (م²)', type: 'number' as const, required: true },
        { key: 'price', label: 'السعر', type: 'number' as const, required: true },
        { 
            key: 'status', 
            label: 'الحالة', 
            type: 'select' as const, 
            required: true,
            options: [
                { value: 'available', label: 'متاح' },
                { value: 'sold', label: 'مباع' },
                { value: 'reserved', label: 'محجوز' }
            ]
        },
        { key: 'description', label: 'الوصف', type: 'textarea' as const }
    ] as FormField[],

    safe: [
        { key: 'name', label: 'اسم الخزنة', type: 'text' as const, required: true },
        { key: 'balance', label: 'الرصيد', type: 'number' as const, required: true }
    ] as FormField[]
};