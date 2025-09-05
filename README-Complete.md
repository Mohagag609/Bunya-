# برنامج إدارة الاستثمار العقاري - النسخة الكاملة

هذا المشروع يحتوي على برنامج إدارة الاستثمار العقاري مع backend وقاعدة بيانات PostgreSQL، بالإضافة إلى النسخة الأصلية التي تعمل مع IndexedDB.

## 📁 هيكل المشروع

```
estate-management/
├── 📄 index.html              # النسخة الأصلية (IndexedDB)
├── 📄 index-backend.html      # النسخة مع Backend
├── 📄 app.js                  # الكود الأصلي
├── 📄 app-backend.js          # الكود المعدل للـ Backend
├── 📄 db.js                   # IndexedDB functions
├── 📄 db-backend.js           # Backend API functions
├── 📄 style.css               # التصميم
├── 📄 manifest.json           # PWA manifest
├── 📄 sw.js                   # Service Worker
├── 📁 backend/                # Backend Code
│   ├── 📄 server.js           # Express server
│   ├── 📄 package.json        # Dependencies
│   ├── 📄 .env.example        # Environment variables
│   ├── 📁 config/
│   │   └── 📄 database.js     # Database configuration
│   ├── 📁 routes/
│   │   ├── 📄 auth.js         # Authentication routes
│   │   ├── 📄 data.js         # Data CRUD routes
│   │   └── 📄 migration.js    # Migration routes
│   └── 📁 scripts/
│       └── 📄 migrate.js      # Migration script
├── 📄 docker-compose.yml      # Docker configuration
├── 📄 Dockerfile              # Backend Docker image
├── 📄 nginx.conf              # Nginx configuration
└── 📄 README-Complete.md      # هذا الملف
```

## 🚀 التشغيل السريع

### 1. النسخة الأصلية (IndexedDB)
```bash
# افتح index.html في المتصفح
open index.html
```

### 2. النسخة مع Backend
```bash
# 1. تشغيل Backend
cd backend
npm install
npm start

# 2. افتح index-backend.html في المتصفح
open index-backend.html
```

### 3. مع Docker
```bash
# تشغيل جميع الخدمات
docker-compose up -d

# فتح المتصفح
open http://localhost
```

## 🔧 التثبيت المفصل

### المتطلبات
- Node.js 18+
- PostgreSQL 15+
- Docker (اختياري)

### 1. تثبيت Backend

```bash
# الانتقال إلى مجلد Backend
cd backend

# تثبيت المتطلبات
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# قم بتعديل .env مع بيانات قاعدة البيانات

# تشغيل قاعدة البيانات PostgreSQL
# تأكد من تشغيل PostgreSQL على المنفذ 5432

# تشغيل الـ Backend
npm start
```

### 2. إعداد قاعدة البيانات

```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE estate_management;

-- إنشاء مستخدم (اختياري)
CREATE USER estate_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE estate_management TO estate_user;
```

### 3. هجرة البيانات

#### من IndexedDB إلى PostgreSQL:

1. **تصدير البيانات من النسخة الأصلية**:
   - افتح `index.html`
   - اذهب إلى "حفظ وتحميل"
   - اضغط "تنزيل ملف البيانات"

2. **استيراد البيانات إلى Backend**:
   ```bash
   # باستخدام API
   curl -X POST http://localhost:3000/api/migration/import \
     -H "Content-Type: application/json" \
     -d @data-export.json

   # أو باستخدام script
   node scripts/migrate.js data-export.json
   ```

3. **أو من خلال الواجهة**:
   - افتح `index-backend.html`
   - اضغط زر "هجرة"
   - اختر ملف البيانات المصدر

## 📊 الميزات

### النسخة الأصلية (IndexedDB)
- ✅ يعمل بدون اتصال بالإنترنت
- ✅ تخزين محلي في المتصفح
- ✅ لا يتطلب خادم
- ✅ سريع في الاستجابة
- ❌ محدود بحجم التخزين
- ❌ لا يمكن الوصول من أجهزة متعددة

### النسخة مع Backend
- ✅ تخزين آمن في PostgreSQL
- ✅ يمكن الوصول من أجهزة متعددة
- ✅ نسخ احتياطية تلقائية
- ✅ مراقبة العمليات (Audit Log)
- ✅ API كامل للبرمجة
- ✅ قابلية التوسع
- ❌ يتطلب خادم
- ❌ يحتاج اتصال بالإنترنت

## 🔌 API Documentation

### Authentication
```bash
# تسجيل الدخول
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# التحقق من التوكن
GET /api/auth/verify
Authorization: Bearer <token>
```

### Data Operations
```bash
# جلب جميع العملاء
GET /api/data/customers

# جلب عميل محدد
GET /api/data/customers/{id}

# إنشاء عميل جديد
POST /api/data/customers
{
  "name": "اسم العميل",
  "phone": "01234567890"
}

# تحديث عميل
PUT /api/data/customers/{id}
{
  "name": "الاسم الجديد"
}

# حذف عميل
DELETE /api/data/customers/{id}
```

### Migration
```bash
# استيراد البيانات
POST /api/migration/import
{
  "data": { ... }
}

# تصدير البيانات
GET /api/migration/export

# حالة الهجرة
GET /api/migration/status
```

## 🐳 Docker Deployment

### تشغيل مع Docker Compose
```bash
# تشغيل جميع الخدمات
docker-compose up -d

# إيقاف الخدمات
docker-compose down

# إعادة بناء الصور
docker-compose up --build

# عرض الـ logs
docker-compose logs -f
```

### تشغيل Backend فقط
```bash
# بناء الصورة
docker build -t estate-backend .

# تشغيل الحاوية
docker run -d -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  estate-backend
```

## 🔒 الأمان

### النسخة الأصلية
- حماية محلية بكلمة مرور
- تشفير البيانات في localStorage

### النسخة مع Backend
- JWT Authentication
- Rate Limiting (1000 طلب/15 دقيقة)
- CORS Protection
- SQL Injection Protection
- Input Validation

## 📈 المراقبة

### Health Check
```bash
# فحص حالة الخدمة
curl http://localhost:3000/health
```

### Logs
```bash
# عرض logs
docker-compose logs backend

# عرض logs قاعدة البيانات
docker-compose logs postgres
```

## 🔄 النسخ الاحتياطية

### النسخة الأصلية
- تصدير يدوي إلى JSON
- حفظ في localStorage

### النسخة مع Backend
- نسخ احتياطية تلقائية لقاعدة البيانات
- تصدير API للبيانات
- Audit Log لجميع العمليات

## 🛠️ التطوير

### إضافة ميزة جديدة

1. **في النسخة الأصلية**:
   - عدل `app.js`
   - أضف الوظيفة المطلوبة

2. **في النسخة مع Backend**:
   - أضف الـ route في `routes/data.js`
   - أضف الجدول في `config/database.js`
   - عدل `app-backend.js` للاستخدام

### إضافة جدول جديد

1. أضف الجدول في `config/database.js`
2. أضف الـ routes في `routes/data.js`
3. أضف الجدول في `routes/migration.js`
4. عدل `db-backend.js` للاستخدام

## 🐛 استكشاف الأخطاء

### مشاكل الاتصال
```bash
# فحص حالة Backend
curl http://localhost:3000/health

# فحص قاعدة البيانات
docker-compose exec postgres psql -U postgres -d estate_management
```

### مشاكل الهجرة
```bash
# فحص logs
docker-compose logs backend

# إعادة تشغيل الخدمات
docker-compose restart
```

## 📞 الدعم

للحصول على المساعدة:
1. راجع الـ logs في `/logs`
2. تحقق من Health Check
3. راجع API documentation
4. تحقق من حالة قاعدة البيانات

## 📝 ملاحظات مهمة

1. **النسخة الأصلية** تعمل بشكل كامل بدون أي تغيير
2. **النسخة مع Backend** تحتاج تشغيل الـ backend أولاً
3. يمكن استخدام نفس البيانات في كلا النسختين
4. النسخة مع Backend تدعم المزيد من الميزات المتقدمة
5. يمكن الانتقال بين النسختين بسهولة

## 🎯 الخطوات التالية

1. اختر النسخة المناسبة لاحتياجاتك
2. قم بتثبيت وتشغيل النسخة المطلوبة
3. هاجر البيانات إذا لزم الأمر
4. استخدم البرنامج حسب احتياجاتك
5. قم بعمل نسخ احتياطية منتظمة