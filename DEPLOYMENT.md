# تعليمات النشر على Render

## الخطوات المطلوبة لنشر التطبيق على Render:

### 1. إعداد قاعدة البيانات
- أنشئ قاعدة بيانات PostgreSQL جديدة على Render
- احصل على رابط الاتصال (Connection String)

### 2. إعداد متغيرات البيئة
في لوحة تحكم Render، أضف المتغيرات التالية:
```
DATABASE_URL=postgresql://username:password@host:port/database
PYTHON_VERSION=3.11.0
```

### 3. إعدادات الخدمة
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn backend.server:app --bind 0.0.0.0:$PORT`
- **Python Version**: 3.11.0

### 4. إعدادات CORS
التطبيق مُعد للعمل مع:
- `https://estate-pro-a62r.onrender.com` (الرابط الحالي)
- أي رابط جديد يتم إنشاؤه تلقائياً

### 5. الملفات المطلوبة
- `requirements.txt` - مكتبات Python المطلوبة
- `Procfile` - أمر التشغيل
- `render.yaml` - إعدادات Render (اختياري)

### 6. اختبار التطبيق
بعد النشر، تأكد من:
- أن الخادم يعمل على المنفذ المحدد
- أن قاعدة البيانات متصلة
- أن API endpoints تعمل بشكل صحيح

## استكشاف الأخطاء

### مشكلة "Failed to fetch"
- تأكد من أن قاعدة البيانات متصلة
- تحقق من متغيرات البيئة
- تأكد من أن CORS مُعد بشكل صحيح

### مشكلة قاعدة البيانات
- تحقق من صحة DATABASE_URL
- تأكد من أن قاعدة البيانات نشطة
- تحقق من صلاحيات الاتصال

## الملفات المُحدثة للنشر:
- `backend/server.py` - إعدادات CORS ديناميكية
- `requirements.txt` - مكتبات Python
- `Procfile` - أمر التشغيل
- `render.yaml` - إعدادات Render