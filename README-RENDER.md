# Estate Management System - Render Deployment

## 🚀 النشر على Render

### 1. إعداد Backend Service

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط "New +" → "Web Service"
3. اربط مع GitHub repository
4. اختر المشروع
5. الإعدادات:
   - **Name**: `bunya`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. Environment Variables:
   ```
   NODE_ENV=production
   DB_HOST=ep-nameless-wind-adg0hpra-pooler.c-2.us-east-1.aws.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=npg_rSJl8TNn6QjO
   JWT_SECRET=estate-management-super-secret-key-2024
   CORS_ORIGIN=https://bunya.onrender.com
   ```

### 2. إعداد Frontend Service

1. اضغط "New +" → "Static Site"
2. اربط مع GitHub repository
3. الإعدادات:
   - **Name**: `bunya-frontend`
   - **Build Command**: `echo "Static site"`
   - **Publish Directory**: `.`
   - **Root Directory**: `.`

### 3. اختبار النشر

بعد انتهاء النشر:

1. **Backend URL**: `https://bunya.onrender.com`
2. **Frontend URL**: `https://bunya-frontend.onrender.com`

### 4. اختبار API

```bash
# فحص Backend
curl https://bunya.onrender.com/health

# فحص قاعدة البيانات
curl https://bunya.onrender.com/api/data/customers
```

### 5. استخدام البرنامج

1. افتح `https://bunya.onrender.com` في المتصفح
2. استخدم جميع الوظائف
3. البيانات تُحفظ في قاعدة بيانات Neon

## 🔧 استكشاف الأخطاء

### إذا لم يعمل Backend:
1. تحقق من Environment Variables
2. راجع Logs في Render Dashboard
3. تأكد من صحة بيانات قاعدة البيانات

### إذا لم يعمل Frontend:
1. تحقق من CORS_ORIGIN
2. راجع Logs في Render Dashboard
3. تأكد من صحة المسارات

## 📝 ملاحظات مهمة

1. **Render Free Plan** قد يوقف الخدمة بعد 15 دقيقة من عدم الاستخدام
2. **قاعدة البيانات** تعمل على Neon
3. **البيانات** محفوظة في PostgreSQL
4. **يمكن الوصول** من أي مكان في العالم