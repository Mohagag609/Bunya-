# 🏢 برنامج إدارة الاستثمار العقاري

نظام إدارة شامل للاستثمارات العقارية مع قاعدة بيانات PostgreSQL وواجهة ويب حديثة.

## ✨ الميزات

- **إدارة شاملة:** العملاء، الوحدات، الشركاء، العقود، الأقساط، الخزن، السندات
- **قاعدة بيانات حقيقية:** PostgreSQL مع علاقات صحيحة وفهرسة محسنة
- **نظام مصادقة آمن:** JWT tokens مع تشفير كلمات المرور
- **واجهة عربية:** تصميم متجاوب وواجهة سهلة الاستخدام
- **تقارير متقدمة:** إحصائيات ولوحة تحكم شاملة
- **API متكامل:** RESTful API لجميع العمليات
- **أمان محسن:** Rate limiting, CORS protection, Audit logging

## 🚀 التشغيل السريع

### محلياً (Local Development)

1. **تثبيت التبعيات:**
   ```bash
   npm install
   ```

2. **إعداد قاعدة البيانات:**
   ```bash
   # تثبيت PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # إنشاء قاعدة البيانات
   sudo -u postgres psql -c "CREATE DATABASE estate_management;"
   sudo -u postgres psql -c "CREATE USER estate_user WITH PASSWORD 'estate123';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE estate_management TO estate_user;"
   ```

3. **تشغيل Migration:**
   ```bash
   npm run migrate
   ```

4. **تشغيل التطبيق:**
   ```bash
   npm start
   ```

5. **الوصول للتطبيق:**
   - الرابط: `http://localhost:3000`
   - المستخدم: `admin`
   - كلمة المرور: `admin123`

### على Render.com (Production)

راجع ملف `DEPLOY_RENDER.md` للتعليمات التفصيلية.

## 📁 هيكل المشروع

```
estate-management/
├── database/
│   ├── schema.sql          # تصميم قاعدة البيانات
│   └── connection.js       # إدارة الاتصال
├── routes/
│   ├── auth.js            # المصادقة
│   ├── customers.js       # العملاء
│   ├── units.js          # الوحدات
│   ├── partners.js       # الشركاء
│   ├── contracts.js      # العقود
│   ├── safes.js          # الخزن
│   ├── vouchers.js       # السندات
│   └── reports.js        # التقارير
├── middleware/
│   └── auth.js           # middleware المصادقة
├── public/
│   ├── index.html        # الصفحة الرئيسية
│   ├── app.js           # التطبيق الأمامي
│   ├── api.js           # عميل API
│   └── style.css        # التصميم
├── scripts/
│   └── migrate.js        # Migration script
├── server.js            # الخادم الرئيسي
├── package.json         # التبعيات
└── render.yaml          # إعدادات Render
```

## 🗄️ قاعدة البيانات

### الجداول الرئيسية:
- **users** - المستخدمين والمصادقة
- **customers** - بيانات العملاء
- **units** - الوحدات العقارية
- **partners** - الشركاء
- **contracts** - العقود
- **installments** - الأقساط
- **safes** - الخزن المالية
- **vouchers** - السندات المالية
- **audit_log** - سجل العمليات

## 🔧 API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/profile` - بيانات المستخدم

### البيانات
- `GET /api/customers` - قائمة العملاء
- `GET /api/units` - قائمة الوحدات
- `GET /api/contracts` - قائمة العقود
- `GET /api/safes` - قائمة الخزن
- `GET /api/vouchers` - قائمة السندات

### التقارير
- `GET /api/reports/dashboard` - لوحة التحكم
- `GET /api/reports/financial` - التقرير المالي

## 🛠️ التطوير

### إضافة ميزة جديدة:
1. أنشئ route جديد في `routes/`
2. أضف الجدول في `database/schema.sql`
3. حدث `public/api.js` و `public/app.js`
4. اختبر المحلياً ثم انشر

### إضافة تقرير جديد:
1. أضف endpoint في `routes/reports.js`
2. أضف function في `public/app.js`
3. حدث navigation في `public/index.html`

## 🔒 الأمان

- **تشفير كلمات المرور:** bcryptjs
- **JWT Tokens:** للمصادقة
- **Rate Limiting:** حماية من الهجمات
- **CORS Protection:** حماية من الطلبات الضارة
- **Input Validation:** التحقق من صحة البيانات
- **SQL Injection Protection:** استخدام parameterized queries

## 📊 الأداء

- **Database Indexing:** فهرسة محسنة للاستعلامات
- **Connection Pooling:** إدارة اتصالات قاعدة البيانات
- **Caching:** تخزين مؤقت للبيانات المتكررة
- **Pagination:** تقسيم البيانات الكبيرة

## 🚀 النشر

### Render.com (مستحسن)
- سهل وسريع
- دعم PostgreSQL مجاني
- SSL تلقائي
- Auto-deploy من GitHub

### خيارات أخرى:
- Heroku
- DigitalOcean
- AWS
- Google Cloud

## 📞 الدعم

### مشاكل شائعة:
1. **خطأ قاعدة البيانات:** تحقق من PostgreSQL
2. **Migration فشل:** تحقق من الصلاحيات
3. **API لا يعمل:** تحقق من Environment Variables

### للمساعدة:
- راجع `README_DATABASE.md` للتفاصيل التقنية
- راجع `DEPLOY_RENDER.md` للنشر
- تحقق من logs في Render Dashboard

## 📝 الترخيص

MIT License - يمكن استخدام المشروع وتعديله بحرية.

---

**🎉 استمتع بإدارة استثماراتك العقارية!**