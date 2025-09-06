# 🏛️ مدير الاستثمار العقاري - النسخة النظيفة

## 📁 الملفات الأساسية للبرنامج

### الملفات الرئيسية (Frontend)
- **`index.html`** - الصفحة الرئيسية للبرنامج
- **`style.css`** - ملف التصميم الموحد والحديث
- **`app.js`** - الملف الرئيسي للبرنامج
- **`db.js`** - إدارة قاعدة البيانات المحلية

### ملفات الميزات المتقدمة
- **`dashboard_widgets.js`** - لوحة التحكم والرسوم البيانية
- **`smart_search.js`** - نظام البحث الذكي
- **`notifications_system.js`** - نظام الإشعارات
- **`backup_system.js`** - نظام النسخ الاحتياطي
- **`performance_enhancements.js`** - تحسينات الأداء
- **`export_system.js`** - نظام التصدير (PDF, Excel, Word, CSV, JSON)
- **`animations.js`** - الانيميشن والتأثيرات البصرية

### ملفات الخدمة
- **`manifest.json`** - ملف PWA للتطبيق
- **`sw.js`** - Service Worker للتخزين المؤقت

### ملفات الخادم (Backend)
- **`backend/server.py`** - الخادم الرئيسي
- **`backend/requirements.txt`** - متطلبات Python
- **`backend/models.py`** - نماذج قاعدة البيانات
- **`backend/migrate.py`** - هجرة قاعدة البيانات
- **`backend/optimize_db.py`** - تحسين قاعدة البيانات

### ملفات النشر
- **`Dockerfile`** - ملف Docker
- **`docker-compose.yml`** - تكوين Docker Compose
- **`Procfile`** - ملف Heroku/Render
- **`requirements.txt`** - متطلبات Python العامة

## 🚀 كيفية تشغيل البرنامج

### محلياً (Frontend فقط)
```bash
# افتح index.html في المتصفح
open index.html
```

### مع الخادم (Backend + Frontend)
```bash
# تشغيل الخادم
cd backend
python server.py

# أو باستخدام Docker
docker-compose up
```

## ✨ الميزات الرئيسية

- 🎨 تصميم حديث ومتجاوب
- 📊 لوحة تحكم تفاعلية
- 🔍 بحث ذكي متقدم
- 📱 دعم PWA
- 💾 نسخ احتياطي تلقائي
- 📈 تقارير متقدمة
- 🌙 وضع داكن/فاتح
- 🔒 نظام أمان متقدم

## 📱 المتطلبات

- متصفح حديث يدعم JavaScript ES6+
- Python 3.8+ (للخادم)
- Node.js (اختياري للتطوير)

---

**تم تنظيف المشروع بنجاح! 🎉**