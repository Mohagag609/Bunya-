# تحويل المشروع إلى قاعدة بيانات حقيقية

تم تحويل مشروع إدارة الاستثمار العقاري من استخدام IndexedDB إلى قاعدة بيانات PostgreSQL حقيقية مع API backend.

## المكونات الجديدة

### 1. قاعدة البيانات
- **PostgreSQL** - قاعدة بيانات علائقية قوية
- **Schema** - تصميم قاعدة البيانات في `database/schema.sql`
- **Connection** - إدارة الاتصال في `database/connection.js`

### 2. Backend API
- **Node.js + Express** - خادم API
- **JWT Authentication** - نظام مصادقة آمن
- **RESTful API** - واجهات برمجية منظمة
- **Data Validation** - التحقق من صحة البيانات
- **Error Handling** - معالجة الأخطاء

### 3. Frontend محدث
- **API Client** - عميل للتعامل مع API
- **Authentication UI** - واجهة تسجيل الدخول
- **Real-time Data** - بيانات مباشرة من قاعدة البيانات

## التثبيت والإعداد

### 1. تثبيت PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (with Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# تحميل من الموقع الرسمي: https://www.postgresql.org/download/windows/
```

### 2. إعداد قاعدة البيانات
```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE estate_management;
CREATE USER estate_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE estate_management TO estate_user;
\q
```

### 3. تثبيت التبعيات
```bash
npm install
```

### 4. إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل القيم في .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estate_management
DB_USER=estate_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

### 5. تشغيل Migration
```bash
# إنشاء الجداول والبيانات الأولية
npm run migrate
```

### 6. تشغيل التطبيق
```bash
# تشغيل الخادم
npm start

# أو للتطوير مع إعادة التشغيل التلقائي
npm run dev
```

## الوصول للتطبيق

1. افتح المتصفح واذهب إلى: `http://localhost:3000`
2. استخدم بيانات الدخول الافتراضية:
   - **اسم المستخدم:** admin
   - **كلمة المرور:** admin123

## الميزات الجديدة

### 1. نظام المصادقة
- تسجيل الدخول الآمن
- إدارة المستخدمين
- حماية البيانات

### 2. API متكامل
- جميع العمليات متاحة عبر API
- دعم البحث والتصفية
- Pagination للبيانات الكبيرة

### 3. قاعدة بيانات علائقية
- علاقات صحيحة بين الجداول
- فهرسة محسنة للأداء
- ACID compliance للبيانات المالية

### 4. أمان محسن
- تشفير كلمات المرور
- JWT tokens
- Rate limiting
- CORS protection

## هيكل قاعدة البيانات

### الجداول الرئيسية:
- **users** - المستخدمين
- **customers** - العملاء
- **units** - الوحدات
- **partners** - الشركاء
- **contracts** - العقود
- **installments** - الأقساط
- **safes** - الخزن
- **vouchers** - السندات
- **transfers** - التحويلات
- **audit_log** - سجل العمليات

## API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `GET /api/auth/profile` - بيانات المستخدم

### العملاء
- `GET /api/customers` - قائمة العملاء
- `POST /api/customers` - إضافة عميل
- `PUT /api/customers/:id` - تعديل عميل
- `DELETE /api/customers/:id` - حذف عميل

### الوحدات
- `GET /api/units` - قائمة الوحدات
- `POST /api/units` - إضافة وحدة
- `PUT /api/units/:id` - تعديل وحدة
- `DELETE /api/units/:id` - حذف وحدة

### العقود
- `GET /api/contracts` - قائمة العقود
- `POST /api/contracts` - إضافة عقد
- `PUT /api/contracts/:id` - تعديل عقد
- `DELETE /api/contracts/:id` - حذف عقد

### التقارير
- `GET /api/reports/dashboard` - لوحة التحكم
- `GET /api/reports/financial` - التقرير المالي
- `GET /api/reports/units` - تقرير الوحدات
- `GET /api/reports/contracts` - تقرير العقود

## التطوير المستقبلي

### ميزات مقترحة:
1. **إشعارات فورية** - WebSocket للتنبيهات
2. **نسخ احتياطي تلقائي** - Backup system
3. **تقارير متقدمة** - Advanced reporting
4. **تصدير البيانات** - Export to Excel/PDF
5. **API للهواتف** - Mobile app support
6. **تعدد المستخدمين** - Multi-tenant support

### تحسينات الأداء:
1. **Redis Cache** - تخزين مؤقت
2. **Database Indexing** - فهرسة محسنة
3. **CDN** - تسريع التحميل
4. **Load Balancing** - توزيع الأحمال

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من تشغيل PostgreSQL
   - تحقق من بيانات الاتصال في .env

2. **خطأ في Migration**
   - تأكد من صلاحيات المستخدم
   - تحقق من وجود قاعدة البيانات

3. **خطأ في المصادقة**
   - تأكد من JWT_SECRET في .env
   - تحقق من صحة Token

## الدعم

للمساعدة أو الاستفسارات، يرجى مراجعة:
- ملفات السجلات في console
- قاعدة البيانات مباشرة
- API documentation

---

**ملاحظة:** تأكد من تغيير كلمات المرور الافتراضية في بيئة الإنتاج!