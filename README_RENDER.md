# تشغيل المشروع على Render.com

## خطوات النشر على Render

### 1. إعداد المشروع

المشروع جاهز للنشر على Render مع الملفات التالية:
- `render.yaml` - إعدادات Render
- `package.json` - محدث مع scripts مناسبة
- `database/schema.sql` - محدث مع IF NOT EXISTS
- `scripts/migrate.js` - محدث للعمل مع Render

### 2. إنشاء قاعدة البيانات على Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على "New +" ثم "PostgreSQL"
3. اختر:
   - **Name:** estate-db
   - **Database:** estate_management
   - **User:** estate_user
   - **Plan:** Free
4. اضغط "Create Database"

### 3. إنشاء Web Service

1. اذهب إلى "New +" ثم "Web Service"
2. اربط المشروع مع GitHub repository
3. اختر المشروع
4. في إعدادات Build & Deploy:
   - **Build Command:** `npm install && npm run migrate`
   - **Start Command:** `npm start`
   - **Environment:** Node

### 4. إعداد Environment Variables

في إعدادات Web Service، أضف المتغيرات التالية:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=https://your-app-name.onrender.com
```

### 5. ربط قاعدة البيانات

1. في إعدادات Web Service
2. اضغط "Add Environment Variable"
3. أضف المتغيرات التالية من قاعدة البيانات:

```
DB_HOST=from_database_host
DB_PORT=from_database_port
DB_NAME=from_database_name
DB_USER=from_database_user
DB_PASSWORD=from_database_password
```

### 6. النشر

1. اضغط "Create Web Service"
2. انتظر حتى يكتمل البناء والنشر
3. ستحصل على رابط مثل: `https://your-app-name.onrender.com`

## الوصول للتطبيق

1. اذهب إلى الرابط الذي حصلت عليه
2. استخدم بيانات الدخول:
   - **Username:** admin
   - **Password:** admin123

## ملاحظات مهمة

### Free Plan Limitations:
- الخدمة تتوقف بعد 15 دقيقة من عدم الاستخدام
- قد يستغرق التشغيل 30-60 ثانية
- قاعدة البيانات محدودة بـ 1GB

### Production Considerations:
- غيّر كلمة مرور admin فوراً
- استخدم JWT secret قوي
- فعّل SSL في الإعدادات
- راقب استخدام قاعدة البيانات

## استكشاف الأخطاء

### مشاكل شائعة:

1. **Build Failed:**
   - تأكد من أن جميع الملفات موجودة
   - تحقق من package.json scripts

2. **Database Connection Error:**
   - تأكد من صحة environment variables
   - تحقق من أن قاعدة البيانات نشطة

3. **Migration Failed:**
   - تحقق من logs في Render dashboard
   - تأكد من صلاحيات قاعدة البيانات

4. **App Not Starting:**
   - تحقق من PORT environment variable
   - تأكد من أن start command صحيح

## تحسينات للأداء

### للاستخدام المكثف:
1. **Upgrade to Paid Plan:**
   - خادم دائم (لا يتوقف)
   - أداء أفضل
   - دعم فني

2. **Database Optimization:**
   - استخدم indexes إضافية
   - راقب query performance
   - نظف البيانات القديمة

3. **Caching:**
   - أضف Redis للـ caching
   - استخدم CDN للـ static files

## الدعم

للمساعدة:
- تحقق من Render logs
- راجع GitHub repository
- استخدم Render community forum

---

**نصيحة:** ابدأ بـ Free plan للاختبار، ثم انتقل للـ Paid plan للإنتاج!