# 🚀 دليل النشر - نظام إدارة العقارات

## النشر على Render.com

### 1. إعداد المشروع

```bash
# نسخ ملف البيئة
cp .env.example .env

# تثبيت المتطلبات
pip install -r requirements.txt

# اختبار التشغيل المحلي
python3 server.py
```

### 2. إعداد Render.com

1. **إنشاء حساب جديد** على [render.com](https://render.com)
2. **ربط المستودع** من GitHub
3. **اختيار نوع الخدمة**: Web Service
4. **إعدادات النشر**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python server.py`
   - **Python Version**: 3.11.0

### 3. متغيرات البيئة

```env
PORT=5000
FLASK_ENV=production
PYTHON_VERSION=3.11.0
```

### 4. ملفات النشر المطلوبة

- ✅ `server.py` - نقطة دخول الخادم
- ✅ `Procfile` - أوامر التشغيل
- ✅ `render.yaml` - إعدادات Render
- ✅ `requirements.txt` - متطلبات Python
- ✅ `.renderignore` - ملفات مستبعدة

### 5. هيكل الملفات بعد التنظيم

```
📁 المشروع/
├── 📄 server.py              # نقطة دخول الخادم
├── 📄 Procfile               # أوامر التشغيل
├── 📄 render.yaml            # إعدادات Render
├── 📄 requirements.txt       # متطلبات Python
├── 📄 .renderignore          # ملفات مستبعدة
├── 📁 frontend/              # واجهة المستخدم
│   ├── 📄 index.html         # الصفحة الرئيسية
│   ├── 📁 css/               # ملفات التنسيق
│   ├── 📁 js/                # ملفات JavaScript
│   └── 📁 components/        # مكونات واجهة المستخدم
└── 📁 backend/               # الخادم الخلفي
    └── 📄 server.py          # خادم HTTP
```

### 6. اختبار النشر

```bash
# اختبار محلي
python3 server.py

# اختبار health check
curl http://localhost:8000/health

# اختبار الصفحة الرئيسية
curl http://localhost:8000/
```

### 7. استكشاف الأخطاء

#### مشكلة: `python: can't open file '/opt/render/project/src/server.py'`

**الحل**: تأكد من وجود `server.py` في الجذر وليس في مجلد `src/`

#### مشكلة: `ModuleNotFoundError`

**الحل**: تأكد من وجود جميع الملفات المطلوبة في `requirements.txt`

#### مشكلة: `FileNotFoundError`

**الحل**: تأكد من صحة مسارات الملفات في `index.html`

### 8. نصائح النشر

1. **استخدم Python 3.11** للحصول على أفضل أداء
2. **تأكد من وجود health check** في `/health`
3. **اختبر محلياً** قبل النشر
4. **راقب السجلات** في لوحة تحكم Render
5. **استخدم متغيرات البيئة** للإعدادات الحساسة

### 9. مراقبة الأداء

- **Health Check**: `https://your-app.onrender.com/health`
- **الصفحة الرئيسية**: `https://your-app.onrender.com/`
- **السجلات**: متاحة في لوحة تحكم Render

### 10. التحديثات المستقبلية

```bash
# دفع التحديثات
git add .
git commit -m "Update deployment configuration"
git push origin main

# Render سيقوم بالنشر التلقائي
```

---

**ملاحظة**: تأكد من أن جميع المسارات صحيحة وأن الملفات موجودة في الأماكن الصحيحة قبل النشر.