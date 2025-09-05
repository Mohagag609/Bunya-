# إعداد سريع على Render

## 1. إنشاء خدمة جديدة على Render

### إعدادات الخدمة:
- **Type**: Web Service
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn backend.server:app --config gunicorn.conf.py`

### متغيرات البيئة:
```
DATABASE_URL=postgresql://username:password@host:port/database
PYTHON_VERSION=3.11.0
```

## 2. إعداد قاعدة البيانات

### إنشاء قاعدة بيانات PostgreSQL:
- اذهب إلى Render Dashboard
- أنشئ قاعدة بيانات PostgreSQL جديدة
- احصل على Connection String
- أضفها كمتغير بيئة `DATABASE_URL`

## 3. إعدادات إضافية

### CORS:
التطبيق مُعد تلقائياً للعمل مع:
- الرابط الحالي: `https://estate-pro-a62r.onrender.com`
- أي رابط جديد يتم إنشاؤه

### الملفات المطلوبة:
- ✅ `requirements.txt`
- ✅ `Procfile`
- ✅ `gunicorn.conf.py`
- ✅ `backend/server.py` (مُحدث)
- ✅ `backend/run.sh` (مُحدث)

## 4. اختبار النشر

بعد النشر، تحقق من:
1. أن الخادم يعمل بدون أخطاء
2. أن قاعدة البيانات متصلة
3. أن API endpoints تستجيب بشكل صحيح

## 5. استكشاف الأخطاء

### إذا ظهر "Failed to fetch":
- تحقق من متغيرات البيئة
- تأكد من أن قاعدة البيانات نشطة
- تحقق من logs في Render Dashboard

### إذا ظهر خطأ في قاعدة البيانات:
- تأكد من صحة DATABASE_URL
- تحقق من صلاحيات الاتصال
- تأكد من أن قاعدة البيانات نشطة

## 6. الملفات المُحدثة

تم تحديث الملفات التالية للنشر:
- `backend/server.py` - CORS ديناميكي
- `backend/run.sh` - تحسينات الأداء
- `requirements.txt` - مكتبات Python
- `Procfile` - أمر التشغيل
- `gunicorn.conf.py` - إعدادات Gunicorn
- `render.yaml` - إعدادات Render
- `.renderignore` - ملفات مستبعدة