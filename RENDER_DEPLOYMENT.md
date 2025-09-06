# 🚀 دليل النشر على Render

## 📋 خطوات النشر

### 1. إنشاء Web Service جديد
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على "New +" → "Web Service"
3. اربط مع GitHub repository

### 2. إعدادات الخدمة

**Basic Settings:**
- **Name:** `estate-manager` (أو أي اسم تريده)
- **Environment:** `Python 3`
- **Region:** `Oregon (US West)`
- **Branch:** `main` (أو الفرع الذي تريد النشر منه)

**Build & Deploy:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python backend/server.py`

### 3. Environment Variables

أضف المتغيرات التالية في Render:

```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax
```

### 4. إنشاء قاعدة البيانات

1. اذهب إلى "New +" → "PostgreSQL"
2. اختر "Free" plan
3. انسخ `DATABASE_URL` إلى Environment Variables

### 5. إعدادات متقدمة

**Health Check:**
- **Health Check Path:** `/health`

**Auto-Deploy:**
- ✅ تمكين Auto-Deploy من GitHub

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في قاعدة البيانات:**
   ```
   Error: could not connect to server
   ```
   **الحل:** تأكد من صحة `DATABASE_URL`

2. **خطأ في المتطلبات:**
   ```
   ModuleNotFoundError: No module named 'flask'
   ```
   **الحل:** تأكد من وجود `requirements.txt` في الجذر

3. **خطأ في المسار:**
   ```
   ModuleNotFoundError: No module named 'models'
   ```
   **الحل:** تأكد من أن `startCommand` يشير إلى `backend/server.py`

## 📊 مراقبة الأداء

- **Logs:** اذهب إلى "Logs" tab في Render
- **Metrics:** اذهب إلى "Metrics" tab
- **Health Check:** `/health` endpoint

## 🔄 التحديثات

عندما تريد تحديث البرنامج:
1. ادفع التغييرات إلى GitHub
2. Render سيقوم بالتحديث تلقائياً
3. راقب الـ logs للتأكد من النجاح

## 🌐 الوصول للبرنامج

بعد النشر الناجح:
- URL: `https://estate-manager.onrender.com` (أو الاسم الذي اخترته)
- Health Check: `https://estate-manager.onrender.com/health`

---

**✅ البرنامج جاهز للنشر على Render!**