# Backend for Estate Management System

هذا هو الـ backend لبرنامج إدارة الاستثمار العقاري. يوفر API كامل لإدارة جميع البيانات مع قاعدة بيانات PostgreSQL.

## الميزات

- **API كامل**: جميع العمليات CRUD للبيانات
- **قاعدة بيانات PostgreSQL**: تخزين آمن وموثوق
- **مصادقة JWT**: حماية API endpoints
- **هجرة البيانات**: استيراد البيانات من IndexedDB
- **Docker Support**: نشر سهل مع Docker
- **Logging**: تسجيل جميع العمليات
- **Rate Limiting**: حماية من الهجمات

## التثبيت والتشغيل

### 1. التثبيت المحلي

```bash
# تثبيت المتطلبات
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# قم بتعديل .env مع بيانات قاعدة البيانات

# تشغيل قاعدة البيانات (PostgreSQL)
# تأكد من تشغيل PostgreSQL على المنفذ 5432

# تشغيل الـ backend
npm start

# للتطوير
npm run dev
```

### 2. التثبيت مع Docker

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# تشغيل فقط قاعدة البيانات
docker-compose up -d postgres

# تشغيل الـ backend فقط
docker-compose up -d backend
```

## API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `GET /api/auth/verify` - التحقق من التوكن

### البيانات
- `GET /api/data/{entity}` - جلب جميع السجلات
- `GET /api/data/{entity}/:id` - جلب سجل محدد
- `POST /api/data/{entity}` - إنشاء سجل جديد
- `PUT /api/data/{entity}/:id` - تحديث سجل
- `DELETE /api/data/{entity}/:id` - حذف سجل

### الهجرة
- `POST /api/migration/import` - استيراد البيانات من JSON
- `GET /api/migration/export` - تصدير البيانات إلى JSON
- `GET /api/migration/status` - حالة الهجرة
- `POST /api/migration/clear` - مسح جميع البيانات

### التقارير
- `GET /api/data/dashboard` - بيانات لوحة التحكم

## هيكل قاعدة البيانات

### الجداول الرئيسية
- `customers` - العملاء
- `units` - الوحدات
- `partners` - الشركاء
- `contracts` - العقود
- `installments` - الأقساط
- `safes` - الخزن
- `transfers` - التحويلات
- `audit_log` - سجل العمليات

### العلاقات
- `unit_partners` - علاقة الوحدات بالشركاء
- `partner_debts` - ديون الشركاء
- `broker_dues` - مستحقات الوسطاء
- `vouchers` - السندات

## هجرة البيانات

### من IndexedDB إلى PostgreSQL

1. **تصدير البيانات من Frontend**:
   - اذهب إلى صفحة "حفظ وتحميل" في البرنامج
   - اضغط على "تنزيل ملف البيانات"
   - احفظ الملف كـ JSON

2. **استيراد البيانات إلى Backend**:
   ```bash
   # باستخدام API
   curl -X POST http://localhost:3000/api/migration/import \
     -H "Content-Type: application/json" \
     -d @data-export.json

   # أو باستخدام script
   node scripts/migrate.js data-export.json
   ```

### تصدير البيانات
```bash
# تصدير جميع البيانات
curl http://localhost:3000/api/migration/export > backup.json
```

## الأمان

- **JWT Authentication**: جميع العمليات محمية بـ JWT
- **Rate Limiting**: حد أقصى 1000 طلب كل 15 دقيقة
- **CORS Protection**: حماية من الطلبات غير المصرح بها
- **Input Validation**: التحقق من صحة البيانات المدخلة
- **SQL Injection Protection**: حماية من هجمات SQL injection

## المراقبة

- **Health Check**: `GET /health`
- **Logging**: جميع العمليات مسجلة في `audit_log`
- **Error Handling**: معالجة شاملة للأخطاء

## التطوير

### إضافة جدول جديد

1. أضف الجدول في `config/database.js`
2. أضف الـ routes في `routes/data.js`
3. أضف الجدول في `routes/migration.js`

### إضافة API endpoint جديد

1. أضف الـ route في الملف المناسب
2. أضف الـ middleware للمصادقة إذا لزم الأمر
3. أضف الـ logging للعمليات

## النشر

### مع Docker
```bash
# بناء الصورة
docker build -t estate-backend .

# تشغيل الحاوية
docker run -d -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  estate-backend
```

### مع Docker Compose
```bash
# تشغيل جميع الخدمات
docker-compose up -d

# إيقاف الخدمات
docker-compose down

# إعادة بناء الصور
docker-compose up --build
```

## استكشاف الأخطاء

### مشاكل قاعدة البيانات
```bash
# فحص اتصال قاعدة البيانات
docker-compose logs postgres

# الدخول إلى قاعدة البيانات
docker-compose exec postgres psql -U postgres -d estate_management
```

### مشاكل الـ Backend
```bash
# فحص logs
docker-compose logs backend

# إعادة تشغيل الخدمة
docker-compose restart backend
```

## الدعم

للحصول على المساعدة، يرجى مراجعة:
- Logs في `/logs`
- Health check في `/health`
- API documentation في `/api/data/dashboard`