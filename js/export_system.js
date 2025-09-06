// 📊 Advanced Export System for Multiple Formats (PDF, Excel, Word)

class ExportSystem {
    constructor() {
        this.supportedFormats = ['pdf', 'excel', 'word', 'csv', 'json'];
        this.templates = new Map();
        this.init();
    }

    init() {
        this.loadTemplates();
        this.createExportInterface();
        this.bindEvents();
    }

    createExportInterface() {
        // Create export button in header
        const exportButton = document.createElement('button');
        exportButton.className = 'btn secondary';
        exportButton.id = 'export-button';
        exportButton.innerHTML = '<span class="material-icons">download</span> تصدير';
        exportButton.onclick = () => this.showExportModal();

        // Add to tools section
        const tools = document.querySelector('.tools');
        if (tools) {
            tools.appendChild(exportButton);
        }
    }

    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal export-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>تصدير البيانات</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <div class="export-section">
                            <h4>نوع التقرير</h4>
                            <div class="report-types">
                                <label class="radio-option">
                                    <input type="radio" name="report-type" value="customers" checked>
                                    <span class="radio-label">العملاء</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="report-type" value="units">
                                    <span class="radio-label">الوحدات</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="report-type" value="contracts">
                                    <span class="radio-label">العقود</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="report-type" value="installments">
                                    <span class="radio-label">الأقساط</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="report-type" value="financial">
                                    <span class="radio-label">التقرير المالي</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="report-type" value="dashboard">
                                    <span class="radio-label">لوحة التحكم</span>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>صيغة التصدير</h4>
                            <div class="format-options">
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="pdf" checked>
                                    <div class="format-icon">
                                        <span class="material-icons">picture_as_pdf</span>
                                    </div>
                                    <div class="format-info">
                                        <div class="format-name">PDF</div>
                                        <div class="format-desc">للمشاركة والطباعة</div>
                                    </div>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="excel">
                                    <div class="format-icon">
                                        <span class="material-icons">table_chart</span>
                                    </div>
                                    <div class="format-info">
                                        <div class="format-name">Excel</div>
                                        <div class="format-desc">للتحليل والمعالجة</div>
                                    </div>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="word">
                                    <div class="format-icon">
                                        <span class="material-icons">description</span>
                                    </div>
                                    <div class="format-info">
                                        <div class="format-name">Word</div>
                                        <div class="format-desc">للمستندات الرسمية</div>
                                    </div>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="csv">
                                    <div class="format-icon">
                                        <span class="material-icons">table_rows</span>
                                    </div>
                                    <div class="format-info">
                                        <div class="format-name">CSV</div>
                                        <div class="format-desc">للاستيراد في برامج أخرى</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>خيارات التصدير</h4>
                            <div class="export-options-grid">
                                <label class="checkbox-option">
                                    <input type="checkbox" id="include-charts" checked>
                                    <span class="checkbox-label">تضمين الرسوم البيانية</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="include-summary" checked>
                                    <span class="checkbox-label">تضمين الملخص</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="include-details">
                                    <span class="checkbox-label">تضمين التفاصيل الكاملة</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="include-logo" checked>
                                    <span class="checkbox-label">تضمين الشعار</span>
                                </label>
                            </div>
                        </div>

                        <div class="export-section">
                            <h4>نطاق البيانات</h4>
                            <div class="date-range">
                                <div class="date-input-group">
                                    <label class="form-label">من تاريخ</label>
                                    <input type="date" id="date-from" class="form-input">
                                </div>
                                <div class="date-input-group">
                                    <label class="form-label">إلى تاريخ</label>
                                    <input type="date" id="date-to" class="form-input">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button class="btn primary" onclick="exportSystem.exportData()">
                        <span class="material-icons">download</span>
                        تصدير
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Set default dates
        const today = new Date();
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        document.getElementById('date-from').value = oneMonthAgo.toISOString().split('T')[0];
        document.getElementById('date-to').value = today.toISOString().split('T')[0];
    }

    async exportData() {
        const reportType = document.querySelector('input[name="report-type"]:checked').value;
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const options = this.getExportOptions();

        try {
            this.showExportProgress();

            let data;
            switch (reportType) {
                case 'customers':
                    data = await this.exportCustomers(options);
                    break;
                case 'units':
                    data = await this.exportUnits(options);
                    break;
                case 'contracts':
                    data = await this.exportContracts(options);
                    break;
                case 'installments':
                    data = await this.exportInstallments(options);
                    break;
                case 'financial':
                    data = await this.exportFinancialReport(options);
                    break;
                case 'dashboard':
                    data = await this.exportDashboard(options);
                    break;
                default:
                    throw new Error('نوع التقرير غير مدعوم');
            }

            await this.generateFile(data, format, options);
            this.hideExportProgress();
            this.showSuccessMessage('تم تصدير البيانات بنجاح');

            // Close modal
            document.querySelector('.export-modal').remove();

        } catch (error) {
            console.error('Export failed:', error);
            this.hideExportProgress();
            this.showErrorMessage('فشل في تصدير البيانات: ' + error.message);
        }
    }

    getExportOptions() {
        return {
            includeCharts: document.getElementById('include-charts').checked,
            includeSummary: document.getElementById('include-summary').checked,
            includeDetails: document.getElementById('include-details').checked,
            includeLogo: document.getElementById('include-logo').checked,
            dateFrom: document.getElementById('date-from').value,
            dateTo: document.getElementById('date-to').value
        };
    }

    // Export Methods for Different Data Types
    async exportCustomers(options) {
        const customers = state.customers || [];
        const filteredCustomers = this.filterByDateRange(customers, options.dateFrom, options.dateTo);

        return {
            title: 'تقرير العملاء',
            data: filteredCustomers,
            headers: ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'العنوان', 'تاريخ الإضافة', 'ملاحظات'],
            fields: ['name', 'phone', 'email', 'address', 'createdAt', 'notes'],
            summary: {
                total: filteredCustomers.length,
                withEmail: filteredCustomers.filter(c => c.email).length,
                withPhone: filteredCustomers.filter(c => c.phone).length
            }
        };
    }

    async exportUnits(options) {
        const units = state.units || [];
        const filteredUnits = this.filterByDateRange(units, options.dateFrom, options.dateTo);

        return {
            title: 'تقرير الوحدات',
            data: filteredUnits,
            headers: ['الكود', 'الاسم', 'العمارة', 'الدور', 'المساحة', 'السعر', 'الحالة', 'ملاحظات'],
            fields: ['code', 'name', 'building', 'floor', 'area', 'price', 'status', 'notes'],
            summary: {
                total: filteredUnits.length,
                available: filteredUnits.filter(u => u.status === 'available').length,
                sold: filteredUnits.filter(u => u.status === 'sold').length,
                reserved: filteredUnits.filter(u => u.status === 'reserved').length,
                totalValue: filteredUnits.reduce((sum, u) => sum + (parseFloat(u.price) || 0), 0)
            }
        };
    }

    async exportContracts(options) {
        const contracts = state.contracts || [];
        const filteredContracts = this.filterByDateRange(contracts, options.dateFrom, options.dateTo);

        return {
            title: 'تقرير العقود',
            data: filteredContracts,
            headers: ['رقم العقد', 'كود الوحدة', 'اسم العميل', 'تاريخ العقد', 'إجمالي السعر', 'الحالة', 'ملاحظات'],
            fields: ['contractNumber', 'unitCode', 'customerName', 'date', 'totalPrice', 'status', 'notes'],
            summary: {
                total: filteredContracts.length,
                active: filteredContracts.filter(c => c.status === 'active').length,
                completed: filteredContracts.filter(c => c.status === 'completed').length,
                totalValue: filteredContracts.reduce((sum, c) => sum + (parseFloat(c.totalPrice) || 0), 0)
            }
        };
    }

    async exportInstallments(options) {
        const installments = state.installments || [];
        const filteredInstallments = this.filterByDateRange(installments, options.dateFrom, options.dateTo);

        return {
            title: 'تقرير الأقساط',
            data: filteredInstallments,
            headers: ['كود الوحدة', 'رقم القسط', 'المبلغ', 'تاريخ الاستحقاق', 'تاريخ الدفع', 'الحالة', 'طريقة الدفع'],
            fields: ['unitCode', 'installmentNumber', 'amount', 'dueDate', 'paidAt', 'status', 'paymentMethod'],
            summary: {
                total: filteredInstallments.length,
                paid: filteredInstallments.filter(i => i.paid).length,
                overdue: filteredInstallments.filter(i => !i.paid && new Date(i.dueDate) < new Date()).length,
                totalAmount: filteredInstallments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
                paidAmount: filteredInstallments.filter(i => i.paid).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
            }
        };
    }

    async exportFinancialReport(options) {
        const data = {
            revenue: this.calculateRevenue(options),
            expenses: this.calculateExpenses(options),
            profit: 0,
            customers: (state.customers || []).length,
            units: (state.units || []).length,
            contracts: (state.contracts || []).length
        };

        data.profit = data.revenue - data.expenses;

        return {
            title: 'التقرير المالي',
            data: data,
            type: 'financial',
            summary: data
        };
    }

    async exportDashboard(options) {
        const dashboardData = {
            summary: this.getDashboardSummary(),
            charts: options.includeCharts ? await this.generateDashboardCharts() : null,
            recentActivity: this.getRecentActivity(),
            alerts: this.getActiveAlerts()
        };

        return {
            title: 'تقرير لوحة التحكم',
            data: dashboardData,
            type: 'dashboard'
        };
    }

    // File Generation Methods
    async generateFile(data, format, options) {
        const fileName = `${data.title}_${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'pdf':
                await this.generatePDF(data, fileName, options);
                break;
            case 'excel':
                await this.generateExcel(data, fileName, options);
                break;
            case 'word':
                await this.generateWord(data, fileName, options);
                break;
            case 'csv':
                await this.generateCSV(data, fileName, options);
                break;
            case 'json':
                await this.generateJSON(data, fileName, options);
                break;
            default:
                throw new Error('صيغة التصدير غير مدعومة');
        }
    }

    async generatePDF(data, fileName, options) {
        // Use jsPDF for PDF generation
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;

        // Add logo if enabled
        if (options.includeLogo) {
            // Add logo placeholder
            doc.setFontSize(16);
            doc.text('🏛️ مدير الاستثمار العقاري', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;
        }

        // Add title
        doc.setFontSize(20);
        doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Add date
        doc.setFontSize(12);
        doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        // Add summary if enabled
        if (options.includeSummary && data.summary) {
            doc.setFontSize(14);
            doc.text('ملخص التقرير', 20, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            for (const [key, value] of Object.entries(data.summary)) {
                doc.text(`${this.getFieldLabel(key)}: ${value}`, 20, yPosition);
                yPosition += 6;
            }
            yPosition += 10;
        }

        // Add data table
        if (data.data && Array.isArray(data.data)) {
            this.addTableToPDF(doc, data, yPosition, pageWidth);
        }

        // Save the PDF
        doc.save(`${fileName}.pdf`);
    }

    addTableToPDF(doc, data, startY, pageWidth) {
        const headers = data.headers || [];
        const fields = data.fields || [];
        const tableData = data.data || [];
        
        if (tableData.length === 0) return;

        const colWidth = (pageWidth - 40) / headers.length;
        let yPosition = startY;

        // Add table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        headers.forEach((header, index) => {
            doc.text(header, 20 + (index * colWidth), yPosition);
        });
        yPosition += 8;

        // Add table data
        doc.setFont(undefined, 'normal');
        tableData.forEach((row, rowIndex) => {
            if (yPosition > 280) { // Check if we need a new page
                doc.addPage();
                yPosition = 20;
            }

            fields.forEach((field, colIndex) => {
                const value = this.formatCellValue(row[field]);
                doc.text(value, 20 + (colIndex * colWidth), yPosition);
            });
            yPosition += 6;
        });
    }

    async generateExcel(data, fileName, options) {
        // Use XLSX library for Excel generation
        if (!window.XLSX) {
            throw new Error('XLSX library not loaded');
        }

        const workbook = XLSX.utils.book_new();
        
        // Create main data sheet
        if (data.data && Array.isArray(data.data)) {
            const worksheet = this.createExcelWorksheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
        }

        // Add summary sheet if enabled
        if (options.includeSummary && data.summary) {
            const summarySheet = this.createSummarySheet(data.summary);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص');
        }

        // Add charts sheet if enabled
        if (options.includeCharts && data.charts) {
            const chartsSheet = this.createChartsSheet(data.charts);
            XLSX.utils.book_append_sheet(workbook, chartsSheet, 'الرسوم البيانية');
        }

        // Save the Excel file
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    createExcelWorksheet(data) {
        const headers = data.headers || [];
        const fields = data.fields || [];
        const tableData = data.data || [];

        // Create worksheet data
        const worksheetData = [
            headers, // Headers row
            ...tableData.map(row => fields.map(field => this.formatCellValue(row[field])))
        ];

        return XLSX.utils.aoa_to_sheet(worksheetData);
    }

    createSummarySheet(summary) {
        const summaryData = Object.entries(summary).map(([key, value]) => [
            this.getFieldLabel(key),
            value
        ]);

        return XLSX.utils.aoa_to_sheet([
            ['المؤشر', 'القيمة'],
            ...summaryData
        ]);
    }

    createChartsSheet(charts) {
        // Placeholder for charts data
        return XLSX.utils.aoa_to_sheet([
            ['الرسوم البيانية'],
            ['سيتم إضافة الرسوم البيانية في إصدارات مستقبلية']
        ]);
    }

    async generateWord(data, fileName, options) {
        // Simple Word-like document using HTML
        const htmlContent = this.generateWordHTML(data, options);
        
        // Create and download HTML file
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateWordHTML(data, options) {
        let html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>${data.title}</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 40px; direction: rtl; }
                h1 { text-align: center; color: #1976d2; }
                h2 { color: #424242; border-bottom: 2px solid #1976d2; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .summary-item { margin: 5px 0; }
                .logo { text-align: center; font-size: 24px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
        `;

        // Add logo
        if (options.includeLogo) {
            html += '<div class="logo">🏛️ مدير الاستثمار العقاري</div>';
        }

        // Add title
        html += `<h1>${data.title}</h1>`;
        html += `<p style="text-align: center;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>`;

        // Add summary
        if (options.includeSummary && data.summary) {
            html += '<div class="summary"><h2>ملخص التقرير</h2>';
            for (const [key, value] of Object.entries(data.summary)) {
                html += `<div class="summary-item"><strong>${this.getFieldLabel(key)}:</strong> ${value}</div>`;
            }
            html += '</div>';
        }

        // Add data table
        if (data.data && Array.isArray(data.data)) {
            html += '<h2>البيانات</h2>';
            html += '<table>';
            html += '<thead><tr>';
            (data.headers || []).forEach(header => {
                html += `<th>${header}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            (data.data || []).forEach(row => {
                html += '<tr>';
                (data.fields || []).forEach(field => {
                    html += `<td>${this.formatCellValue(row[field])}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        }

        html += '</body></html>';
        return html;
    }

    async generateCSV(data, fileName, options) {
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('لا توجد بيانات للتصدير');
        }

        const headers = data.headers || [];
        const fields = data.fields || [];
        const tableData = data.data || [];

        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        tableData.forEach(row => {
            const values = fields.map(field => {
                const value = this.formatCellValue(row[field]);
                // Escape commas and quotes
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += values.join(',') + '\n';
        });

        // Add BOM for proper Arabic display
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async generateJSON(data, fileName, options) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Utility Methods
    filterByDateRange(data, dateFrom, dateTo) {
        if (!dateFrom && !dateTo) return data;

        return data.filter(item => {
            const itemDate = new Date(item.createdAt || item.date || item.dueDate);
            const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
            const toDate = dateTo ? new Date(dateTo) : new Date();

            return itemDate >= fromDate && itemDate <= toDate;
        });
    }

    formatCellValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toLocaleString('ar-EG');
        if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
        if (typeof value === 'string' && value.includes('T')) {
            return new Date(value).toLocaleDateString('ar-EG');
        }
        return value.toString();
    }

    getFieldLabel(key) {
        const labels = {
            total: 'الإجمالي',
            available: 'متاح',
            sold: 'مباع',
            reserved: 'محجوز',
            active: 'نشط',
            completed: 'مكتمل',
            paid: 'مدفوع',
            overdue: 'متأخر',
            totalValue: 'إجمالي القيمة',
            totalAmount: 'إجمالي المبلغ',
            paidAmount: 'المبلغ المدفوع',
            withEmail: 'بالبريد الإلكتروني',
            withPhone: 'بالهاتف'
        };
        return labels[key] || key;
    }

    calculateRevenue(options) {
        const installments = state.installments || [];
        const filteredInstallments = this.filterByDateRange(installments, options.dateFrom, options.dateTo);
        
        return filteredInstallments
            .filter(i => i.paid)
            .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    }

    calculateExpenses(options) {
        const vouchers = state.vouchers || [];
        const filteredVouchers = this.filterByDateRange(vouchers, options.dateFrom, options.dateTo);
        
        return filteredVouchers
            .filter(v => v.type === 'expense')
            .reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
    }

    getDashboardSummary() {
        return {
            totalCustomers: (state.customers || []).length,
            totalUnits: (state.units || []).length,
            activeContracts: (state.contracts || []).filter(c => c.status === 'active').length,
            totalRevenue: this.calculateRevenue({})
        };
    }

    async generateDashboardCharts() {
        // Placeholder for chart generation
        return {
            revenueChart: 'Revenue chart data',
            unitsChart: 'Units chart data',
            customersChart: 'Customers chart data'
        };
    }

    getRecentActivity() {
        // Get recent activities from audit log
        const auditLog = state.auditLog || [];
        return auditLog.slice(-10).reverse();
    }

    getActiveAlerts() {
        // Get active alerts
        if (window.notificationSystem) {
            return window.notificationSystem.getNotifications().filter(n => !n.read);
        }
        return [];
    }

    loadTemplates() {
        // Load export templates
        this.templates.set('default', {
            font: 'Arial',
            fontSize: 12,
            margin: 20,
            headerColor: '#1976d2',
            textColor: '#424242'
        });
    }

    bindEvents() {
        // Bind export events
        document.addEventListener('exportRequested', (e) => {
            this.showExportModal();
        });
    }

    showExportProgress() {
        const progress = document.createElement('div');
        progress.id = 'export-progress';
        progress.className = 'export-progress';
        progress.innerHTML = `
            <div class="progress-content">
                <div class="progress-spinner"></div>
                <div class="progress-text">جاري تصدير البيانات...</div>
            </div>
        `;
        document.body.appendChild(progress);
    }

    hideExportProgress() {
        const progress = document.getElementById('export-progress');
        if (progress) {
            progress.remove();
        }
    }

    showSuccessMessage(message) {
        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                title: 'تصدير البيانات',
                message: message,
                type: 'success'
            });
        } else {
            alert(message);
        }
    }

    showErrorMessage(message) {
        if (window.notificationSystem) {
            window.notificationSystem.createNotification({
                title: 'خطأ في التصدير',
                message: message,
                type: 'error'
            });
        } else {
            alert(message);
        }
    }
}

// Initialize export system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.exportSystem = new ExportSystem();
});

// Add CSS for export system
const exportStyles = `
<style>
.export-modal .modal-content {
    max-width: 800px;
    width: 95%;
}

.export-options {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.export-section {
    background: var(--md-surface-variant);
    padding: 20px;
    border-radius: var(--md-border-radius);
}

.export-section h4 {
    margin: 0 0 16px 0;
    font-size: var(--md-font-size-lg);
    font-weight: 600;
    color: var(--md-on-surface);
}

.report-types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--md-surface);
    border: 1px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius);
    cursor: pointer;
    transition: var(--md-transition);
}

.radio-option:hover {
    background: var(--md-primary);
    color: var(--md-on-primary);
}

.radio-option input[type="radio"] {
    margin: 0;
}

.radio-label {
    font-weight: 500;
}

.format-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
}

.format-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--md-surface);
    border: 2px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius-lg);
    cursor: pointer;
    transition: var(--md-transition);
}

.format-option:hover {
    border-color: var(--md-primary);
    background: var(--md-surface-variant);
}

.format-option input[type="radio"]:checked + .format-icon {
    color: var(--md-primary);
}

.format-icon {
    font-size: 32px;
    color: var(--md-on-surface-variant);
    transition: var(--md-transition);
}

.format-info {
    flex: 1;
}

.format-name {
    font-size: var(--md-font-size-lg);
    font-weight: 600;
    color: var(--md-on-surface);
    margin-bottom: 4px;
}

.format-desc {
    font-size: var(--md-font-size-sm);
    color: var(--md-on-surface-variant);
}

.export-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--md-surface);
    border: 1px solid var(--md-surface-variant);
    border-radius: var(--md-border-radius);
    cursor: pointer;
    transition: var(--md-transition);
}

.checkbox-option:hover {
    background: var(--md-surface-variant);
}

.checkbox-option input[type="checkbox"] {
    margin: 0;
}

.checkbox-label {
    font-weight: 500;
}

.date-range {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.date-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.progress-content {
    background: var(--md-surface);
    padding: 32px;
    border-radius: var(--md-border-radius-lg);
    text-align: center;
    box-shadow: var(--md-elevation-4);
}

.progress-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--md-surface-variant);
    border-top: 4px solid var(--md-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.progress-text {
    font-size: var(--md-font-size-lg);
    font-weight: 500;
    color: var(--md-on-surface);
}

/* Responsive */
@media (max-width: 768px) {
    .export-modal .modal-content {
        width: 98%;
        margin: 10px;
    }
    
    .format-options {
        grid-template-columns: 1fr;
    }
    
    .report-types {
        grid-template-columns: 1fr;
    }
    
    .date-range {
        grid-template-columns: 1fr;
    }
    
    .export-options-grid {
        grid-template-columns: 1fr;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', exportStyles);