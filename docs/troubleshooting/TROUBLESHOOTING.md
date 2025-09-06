# 🔧 استكشاف الأخطاء - Render Deployment

## ❌ مشاكل شائعة وحلولها

### 1. مشكلة psycopg2 مع Python 3.13

#### الخطأ:
```
ImportError: /opt/render/project/src/.venv/lib/python3.13/site-packages/psycopg2/_psycopg.cpython-313-x86_64-linux-gnu.so: undefined symbol: _PyInterpreterState_Get
```

#### السبب:
- psycopg2 غير متوافق مع Python 3.13
- مشكلة في binary compilation

#### الحل:
```bash
# استخدم psycopg بدلاً من psycopg2
pip install psycopg[binary]==3.1.13
```

### 2. مشكلة في optimize_db.py

#### الخطأ:
```
ModuleNotFoundError: No module named 'dotenv'
```

#### السبب:
- load_dotenv() لم يتم استدعاؤه قبل import
- ترتيب imports خاطئ

#### الحل:
```python
# في بداية الملف
from dotenv import load_dotenv
load_dotenv()

# ثم باقي imports
from server import app, db
```

### 3. مشكلة في قاعدة البيانات

#### الخطأ:
```
connection failed
```

#### السبب:
- DATABASE_URL غير صحيح
- مشكلة في SSL connection

#### الحل:
```bash
# تحقق من DATABASE_URL
echo $DATABASE_URL

# تأكد من SSL settings
DATABASE_URL=postgresql://...?sslmode=require&channel_binding=require
```

### 4. مشكلة في CORS

#### الخطأ:
```
CORS policy error
```

#### السبب:
- ALLOWED_ORIGINS لا يحتوي على domain الجديد
- مشكلة في Render URL

#### الحل:
```python
# في server.py
allowed_origins = [
    "https://your-app.onrender.com",
    "https://your-custom-domain.com"
]
```

## 🛠️ حلول سريعة

### إعادة تشغيل الخدمة
```bash
# في Render Dashboard
Dashboard → Manual Deploy → Deploy latest commit
```

### فحص Logs
```bash
# في Render Dashboard
Dashboard → Logs

# أو باستخدام CLI
render logs --service your-service-name
```

### اختبار محلي
```bash
# تثبيت التبعيات
pip install -r requirements.txt

# اختبار الاتصال
python -c "
from backend.server import app, db
with app.app_context():
    result = db.session.execute('SELECT 1').fetchone()
    print('Database:', result[0])
"
```

## 📋 قائمة التحقق

### قبل النشر
- [ ] DATABASE_URL صحيح
- [ ] requirements.txt محدث
- [ ] Python version متوافق
- [ ] build.sh قابل للتنفيذ

### بعد النشر
- [ ] Health check يعمل
- [ ] API endpoints تستجيب
- [ ] قاعدة البيانات متصلة
- [ ] CORS يعمل

### في حالة الفشل
- [ ] تحقق من Logs
- [ ] تحقق من Environment Variables
- [ ] اختبر محلياً
- [ ] راجع build script

## 🔄 إعادة النشر

### 1. إصلاح المشكلة محلياً
```bash
# اختبار محلي
python backend/server.py

# اختبار API
curl http://localhost:8000/health
```

### 2. رفع التحديثات
```bash
git add .
git commit -m "Fix psycopg2 compatibility issue"
git push origin main
```

### 3. مراقبة النشر
- انتظر حتى تكتمل عملية البناء
- تحقق من Logs
- اختبر Health Check

## 📞 الدعم

### Render Support
- [Render Documentation](https://render.com/docs)
- [Render Support](https://render.com/support)

### Python/PostgreSQL
- [psycopg Documentation](https://www.psycopg.org/docs/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)

### المشروع
- جميع الحلول محفوظة في الكود
- يمكن تطبيقها على أي منصة أخرى
- الكود مُوثق ومُختبر