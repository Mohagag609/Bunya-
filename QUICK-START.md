# 🚀 دليل التشغيل السريع

## 1. النسخة الأصلية (تعمل فوراً)

```bash
# افتح index.html في المتصفح
open index.html
```

## 2. النسخة مع Backend (محلياً)

```bash
# 1. تثبيت المتطلبات
npm install

# 2. تشغيل Backend
npm start

# 3. افتح index-backend.html
open index-backend.html
```

## 3. النسخة مع Render (على الإنترنت)

### أ) إعداد قاعدة البيانات:
1. اذهب إلى [Render.com](https://render.com)
2. اضغط "New +" → "PostgreSQL"
3. اختر:
   - **Name**: `estate-management-db`
   - **Database**: `estate_management`
   - **User**: `estate_user`
4. اضغط "Create Database"

### ب) نشر Backend:
1. اضغط "New +" → "Web Service"
2. اربط مع GitHub
3. اختر المشروع
4. الإعدادات:
   - **Name**: `estate-management-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     DB_HOST=your-postgres-host
     DB_PORT=5432
     DB_NAME=estate_management
     DB_USER=estate_user
     DB_PASSWORD=your-password
     JWT_SECRET=your-secret-key
     CORS_ORIGIN=https://your-frontend-url
     ```

### ج) نشر Frontend:
1. اضغط "New +" → "Static Site"
2. اربط مع GitHub
3. الإعدادات:
   - **Name**: `estate-management-frontend`
   - **Build Command**: `echo "Static site"`
   - **Publish Directory**: `.`
   - **Root Directory**: `.`

## 4. هجرة البيانات

### من النسخة الأصلية:
1. افتح `index.html`
2. اذهب إلى "حفظ وتحميل"
3. اضغط "تنزيل ملف البيانات"

### إلى النسخة الجديدة:
1. افتح `index-backend.html` أو `index-render.html`
2. اضغط زر "هجرة"
3. اختر ملف البيانات

## 5. استكشاف الأخطاء

### إذا لم يعمل Backend:
```bash
# تحقق من الـ logs
npm start

# تحقق من قاعدة البيانات
# تأكد من تشغيل PostgreSQL
```

### إذا لم يعمل على Render:
1. تحقق من Environment Variables
2. راجع Logs في Render Dashboard
3. تأكد من صحة بيانات قاعدة البيانات

## 6. الملفات المهمة

- `index.html` - النسخة الأصلية
- `index-backend.html` - النسخة مع Backend محلي
- `index-render.html` - النسخة مع Render
- `app.js` - الكود الأصلي
- `app-backend.js` - الكود المعدل
- `db.js` - IndexedDB
- `db-backend.js` - Backend محلي
- `db-render.js` - Backend على Render

## 7. نصائح مهمة

1. **ابدأ بالنسخة الأصلية** للتأكد من عمل البرنامج
2. **جرب النسخة المحلية** قبل النشر على Render
3. **احفظ نسخة احتياطية** من البيانات دائماً
4. **تحقق من الـ logs** عند حدوث مشاكل

## 8. الدعم

إذا واجهت مشاكل:
1. راجع الـ logs
2. تحقق من إعدادات قاعدة البيانات
3. تأكد من صحة Environment Variables
4. جرب النسخة الأصلية أولاً