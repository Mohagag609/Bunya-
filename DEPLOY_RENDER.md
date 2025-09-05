# 🚀 نشر المشروع على Render.com - دليل سريع

## الخطوات السريعة

### 1. رفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Initial commit - Estate Management System"
git branch -M main
git remote add origin https://github.com/yourusername/estate-management.git
git push -u origin main
```

### 2. إنشاء قاعدة البيانات على Render
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط "New +" → "PostgreSQL"
3. اختر:
   - **Name:** `estate-db`
   - **Database:** `estate_management`
   - **User:** `estate_user`
   - **Plan:** Free
4. اضغط "Create Database"

### 3. إنشاء Web Service
1. اضغط "New +" → "Web Service"
2. اربط مع GitHub repository
3. اختر المشروع
4. في الإعدادات:
   - **Build Command:** `npm install && npm run migrate`
   - **Start Command:** `npm start`
   - **Environment:** Node

### 4. إعداد Environment Variables
أضف هذه المتغيرات في إعدادات Web Service:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=estate_management_secret_2024
CORS_ORIGIN=https://your-app-name.onrender.com
```

ثم أضف متغيرات قاعدة البيانات من Database settings:
- `DB_HOST` (من Database)
- `DB_PORT` (من Database)
- `DB_NAME` (من Database)
- `DB_USER` (من Database)
- `DB_PASSWORD` (من Database)

### 5. النشر
1. اضغط "Create Web Service"
2. انتظر البناء (5-10 دقائق)
3. احصل على الرابط: `https://your-app-name.onrender.com`

## 🔑 بيانات الدخول
- **Username:** `admin`
- **Password:** `admin123`

## ⚠️ ملاحظات مهمة

### Free Plan:
- الخدمة تتوقف بعد 15 دقيقة من عدم الاستخدام
- التشغيل يستغرق 30-60 ثانية
- قاعدة البيانات محدودة بـ 1GB

### بعد النشر:
1. **غيّر كلمة مرور admin فوراً**
2. **أضف مستخدمين جدد**
3. **احتفظ بنسخة احتياطية من البيانات**

## 🛠️ استكشاف الأخطاء

### Build Failed:
- تحقق من GitHub repository
- تأكد من وجود جميع الملفات
- راجع Build logs

### Database Error:
- تأكد من Environment Variables
- تحقق من Database status
- راجع Database logs

### App Not Loading:
- انتظر 1-2 دقيقة للتشغيل
- تحقق من Health check
- راجع Application logs

## 📞 الدعم
- Render Dashboard → Logs
- GitHub Issues
- Render Community

---
**🎉 مبروك! مشروعك الآن على الإنترنت!**