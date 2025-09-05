# تحويل من IndexedDB إلى SQL

تم تحويل نظام إدارة الاستثمار العقاري من استخدام IndexedDB إلى قاعدة بيانات SQL باستخدام SQL.js.

## الملفات الجديدة

### 1. `schema.sql`
- يحتوي على هيكل قاعدة البيانات SQL الكامل
- جميع الجداول والعلاقات والفهارس
- البيانات الافتراضية

### 2. `sql-db-complete.js`
- مكتبة شاملة للتعامل مع قاعدة البيانات SQL
- جميع العمليات CRUD لكل جدول
- دعم SQL.js للعمل في المتصفح
- وظائف النسخ الاحتياطي والاستعادة

### 3. `app-sql-complete.js`
- النسخة المحدثة من التطبيق الرئيسي
- تستخدم العمليات SQL بدلاً من IndexedDB
- تحافظ على جميع الوظائف الأصلية

### 4. `migrate-to-sql.html`
- أداة تحويل تفاعلية
- تحويل البيانات من localStorage إلى SQL
- نسخ احتياطي واستعادة البيانات

## المزايا الجديدة

### 1. استعلامات SQL قوية
```sql
-- البحث عن العملاء بالاسم
SELECT * FROM customers WHERE name LIKE '%أحمد%';

-- إحصائيات الوحدات
SELECT status, COUNT(*) as count FROM units GROUP BY status;

-- تقرير الأقساط المستحقة
SELECT i.*, u.code as unit_code, c.name as customer_name 
FROM installments i 
JOIN units u ON i.unit_id = u.id 
JOIN contracts ct ON ct.unit_id = u.id 
JOIN customers c ON ct.customer_id = c.id 
WHERE i.status = 'غير مدفوع' 
ORDER BY i.due_date;
```

### 2. العلاقات بين الجداول
- علاقات Foreign Key لضمان سلامة البيانات
- حذف تلقائي للبيانات المرتبطة
- فهرسة محسنة للأداء

### 3. النسخ الاحتياطي والاستعادة
```javascript
// تصدير قاعدة البيانات
const backup = SQLDB.export();

// استيراد قاعدة البيانات
SQLDB.import(backup);
```

## كيفية الاستخدام

### 1. التحويل من النسخة القديمة
1. افتح `migrate-to-sql.html` في المتصفح
2. اضغط على "بدء التحويل"
3. انتظر حتى اكتمال العملية
4. استخدم النسخة الجديدة

### 2. استخدام النسخة الجديدة
1. تأكد من تحميل `sql-db-complete.js` قبل `app-sql.js`
2. التطبيق سيعمل تلقائياً مع SQL
3. جميع الوظائف متاحة كما هي

### 3. النسخ الاحتياطي
```javascript
// في وحدة التحكم في المتصفح
const backup = SQLDB.export();
localStorage.setItem('sql_backup', JSON.stringify(Array.from(backup)));
```

## هيكل قاعدة البيانات

### الجداول الرئيسية
- `customers` - العملاء
- `units` - الوحدات العقارية
- `partners` - الشركاء
- `contracts` - العقود
- `installments` - الأقساط
- `safes` - الخزائن
- `vouchers` - السندات
- `broker_dues` - عمولات السماسرة
- `partner_debts` - ديون الشركاء
- `transfers` - التحويلات
- `audit_log` - سجل العمليات

### الجداول المساعدة
- `settings` - الإعدادات
- `keyval` - بيانات متنوعة
- `partner_groups` - مجموعات الشركاء
- `partner_group_members` - أعضاء مجموعات الشركاء
- `brokers` - السماسرة

## الميزات المحسنة

### 1. الأداء
- فهرسة محسنة للبحث السريع
- استعلامات محسنة
- إدارة أفضل للذاكرة

### 2. سلامة البيانات
- قيود Foreign Key
- التحقق من صحة البيانات
- معاملات آمنة

### 3. المرونة
- استعلامات SQL مخصصة
- تقارير متقدمة
- تحليل البيانات

## استعلامات مفيدة

### إحصائيات شاملة
```sql
SELECT 
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM units) as total_units,
    (SELECT COUNT(*) FROM contracts) as total_contracts,
    (SELECT SUM(balance) FROM safes) as total_balance;
```

### تقرير الأقساط المتأخرة
```sql
SELECT 
    u.code as unit_code,
    c.name as customer_name,
    i.amount,
    i.due_date,
    JULIANDAY('now') - JULIANDAY(i.due_date) as days_overdue
FROM installments i
JOIN units u ON i.unit_id = u.id
JOIN contracts ct ON ct.unit_id = u.id
JOIN customers c ON ct.customer_id = c.id
WHERE i.status = 'غير مدفوع' 
AND i.due_date < date('now')
ORDER BY days_overdue DESC;
```

### تقرير المبيعات الشهرية
```sql
SELECT 
    strftime('%Y-%m', created_at) as month,
    COUNT(*) as contracts_count,
    SUM(total_price) as total_sales
FROM contracts
GROUP BY strftime('%Y-%m', created_at)
ORDER BY month DESC;
```

## استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في تحميل SQL.js**: تأكد من الاتصال بالإنترنت
2. **فشل في التحويل**: تحقق من صحة البيانات في localStorage
3. **بطء في الأداء**: استخدم الفهارس للاستعلامات المتكررة

### حلول
1. استخدم النسخة المحلية من SQL.js
2. تحقق من سجل الأخطاء في وحدة التحكم
3. استخدم `EXPLAIN QUERY PLAN` لتحليل الاستعلامات

## الدعم

للحصول على المساعدة:
1. تحقق من سجل الأخطاء في وحدة التحكم
2. استخدم أداة التحويل لإعادة تحويل البيانات
3. استخدم النسخ الاحتياطي لاستعادة البيانات

## التطوير المستقبلي

### ميزات مقترحة
1. واجهة برمجة تطبيقات REST
2. تقارير متقدمة مع الرسوم البيانية
3. تصدير البيانات بصيغ مختلفة
4. مزامنة البيانات مع الخادم
5. نسخ احتياطي تلقائي

### تحسينات الأداء
1. تحسين الفهارس
2. تقسيم الجداول الكبيرة
3. تخزين مؤقت للاستعلامات
4. ضغط البيانات