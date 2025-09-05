import type { TableColumn, FilterOptions } from '../types/index.js';
import { searchItems, sortItems } from '../utils/helpers.js';

export interface TableProps<T> {
    data: T[];
    columns: TableColumn[];
    onRowClick?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    filters?: FilterOptions;
    onFiltersChange?: (filters: FilterOptions) => void;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}

export class Table<T extends Record<string, any>> {
    private props: TableProps<T>;
    private container: HTMLElement;
    private filteredData: T[] = [];

    constructor(container: HTMLElement, props: TableProps<T>) {
        this.container = container;
        this.props = props;
        this.filteredData = [...props.data];
        this.render();
    }

    updateProps(newProps: Partial<TableProps<T>>): void {
        this.props = { ...this.props, ...newProps };
        this.updateData();
        this.render();
    }

    private updateData(): void {
        let data = [...this.props.data];

        // Apply search filter
        if (this.props.filters?.search) {
            const searchFields = this.props.columns
                .filter(col => col.filterable !== false)
                .map(col => col.key as keyof T);
            data = searchItems(data, this.props.filters.search, searchFields);
        }

        // Apply status filter
        if (this.props.filters?.status) {
            data = data.filter(item => item.status === this.props.filters?.status);
        }

        // Apply date filters
        if (this.props.filters?.dateFrom) {
            data = data.filter(item => {
                const itemDate = new Date(item.createdAt || item.date || '');
                const fromDate = new Date(this.props.filters!.dateFrom!);
                return itemDate >= fromDate;
            });
        }

        if (this.props.filters?.dateTo) {
            data = data.filter(item => {
                const itemDate = new Date(item.createdAt || item.date || '');
                const toDate = new Date(this.props.filters!.dateTo!);
                return itemDate <= toDate;
            });
        }

        // Apply sorting
        if (this.props.filters?.sortBy) {
            data = sortItems(
                data,
                this.props.filters.sortBy as keyof T,
                this.props.filters.sortOrder || 'asc'
            );
        }

        this.filteredData = data;
    }

    private render(): void {
        if (this.props.loading) {
            this.container.innerHTML = this.renderLoading();
            return;
        }

        if (this.filteredData.length === 0) {
            this.container.innerHTML = this.renderEmpty();
            return;
        }

        this.container.innerHTML = this.renderTable();
        this.attachEventListeners();
    }

    private renderLoading(): string {
        return `
            <div class="table-loading">
                <div class="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        `;
    }

    private renderEmpty(): string {
        return `
            <div class="table-empty">
                <div class="empty-icon">📋</div>
                <p>${this.props.emptyMessage || 'لا توجد بيانات للعرض'}</p>
            </div>
        `;
    }

    private renderTable(): string {
        const headers = this.props.columns.map(col => `
            <th class="${col.sortable ? 'sortable' : ''}" 
                data-sort="${col.key}"
                data-order="${this.props.filters?.sortBy === col.key ? this.props.filters?.sortOrder || 'asc' : ''}">
                ${col.label}
                ${col.sortable ? '<span class="sort-indicator">↕️</span>' : ''}
            </th>
        `).join('');

        const rows = this.filteredData.map((item, index) => {
            const cells = this.props.columns.map(col => {
                const value = this.formatCellValue(item[col.key], col);
                return `<td>${value}</td>`;
            }).join('');

            const actions = this.renderActions(item);

            return `
                <tr class="table-row" data-index="${index}">
                    ${cells}
                    ${actions ? `<td class="actions">${actions}</td>` : ''}
                </tr>
            `;
        }).join('');

        return `
            <div class="table-container">
                <table class="table ${this.props.className || ''}">
                    <thead>
                        <tr>${headers}${this.props.onEdit || this.props.onDelete ? '<th>الإجراءات</th>' : ''}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    private formatCellValue(value: any, column: TableColumn): string {
        if (value === null || value === undefined) return '—';

        switch (column.type) {
            case 'currency':
                return new Intl.NumberFormat('ar-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(Number(value));

            case 'date':
                return new Date(value).toLocaleDateString('ar-EG');

            case 'status':
                const statusText = this.getStatusText(value);
                const statusColor = this.getStatusColor(value);
                return `<span class="status-badge" style="background-color: ${statusColor}">${statusText}</span>`;

            case 'number':
                return Number(value).toLocaleString('ar-EG');

            default:
                return String(value);
        }
    }

    private getStatusText(status: string): string {
        const statusTexts: Record<string, string> = {
            'active': 'نشط',
            'completed': 'مكتمل',
            'cancelled': 'ملغي',
            'pending': 'معلق',
            'paid': 'مدفوع',
            'overdue': 'متأخر',
            'available': 'متاح',
            'sold': 'مباع',
            'reserved': 'محجوز'
        };
        return statusTexts[status] || status;
    }

    private getStatusColor(status: string): string {
        const statusColors: Record<string, string> = {
            'active': '#10b981',
            'completed': '#059669',
            'cancelled': '#dc2626',
            'pending': '#f59e0b',
            'paid': '#10b981',
            'overdue': '#dc2626',
            'available': '#10b981',
            'sold': '#059669',
            'reserved': '#f59e0b'
        };
        return statusColors[status] || '#6b7280';
    }

    private renderActions(item: T): string {
        const actions = [];
        
        if (this.props.onEdit) {
            actions.push(`<button class="btn btn-sm btn-secondary" data-action="edit">✏️ تعديل</button>`);
        }
        
        if (this.props.onDelete) {
            actions.push(`<button class="btn btn-sm btn-danger" data-action="delete">🗑️ حذف</button>`);
        }

        return actions.join(' ');
    }

    private attachEventListeners(): void {
        // Row click events
        this.container.querySelectorAll('.table-row').forEach((row, index) => {
            row.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).closest('button')) {
                    this.props.onRowClick?.(this.filteredData[index]);
                }
            });
        });

        // Action button events
        this.container.querySelectorAll('[data-action]').forEach(button => {
            const action = (button as HTMLElement).dataset.action;
            const row = (button as HTMLElement).closest('.table-row') as HTMLElement;
            const index = parseInt(row.dataset.index || '0');
            const item = this.filteredData[index];

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                switch (action) {
                    case 'edit':
                        this.props.onEdit?.(item);
                        break;
                    case 'delete':
                        if (confirm('هل أنت متأكد من الحذف؟')) {
                            this.props.onDelete?.(item);
                        }
                        break;
                }
            });
        });

        // Sort events
        this.container.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = (header as HTMLElement).dataset.sort;
                if (!sortBy) return;

                const currentOrder = (header as HTMLElement).dataset.order;
                const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

                this.props.onFiltersChange?.({
                    ...this.props.filters,
                    sortBy: sortBy as keyof T,
                    sortOrder: newOrder as 'asc' | 'desc'
                });
            });
        });
    }

    // Public methods
    getFilteredData(): T[] {
        return [...this.filteredData];
    }

    getTotalCount(): number {
        return this.props.data.length;
    }

    getFilteredCount(): number {
        return this.filteredData.length;
    }
}