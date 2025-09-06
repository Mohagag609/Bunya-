# 🧪 اختبار البرنامج محلياً

## 📋 خطوات الاختبار

### 1. إعداد البيئة المحلية

#### تثبيت Python packages
```bash
# إنشاء virtual environment
python3 -m venv venv
source venv/bin/activate

# تثبيت التبعيات
pip install -r backend/requirements.txt
```

#### أو استخدام pipx
```bash
# تثبيت pipx
sudo apt install pipx

# تثبيت التبعيات
pipx install --include-deps -r backend/requirements.txt
```

### 2. اختبار الاتصال بقاعدة البيانات

#### اختبار سريع
```bash
python3 test_db_connection.py
```

#### اختبار مفصل
```bash
python3 -c "
from backend.server import app, db
with app.app_context():
    result = db.session.execute('SELECT 1').fetchone()
    print('Database connection:', result[0])
"
```

### 3. تشغيل البرنامج محلياً

#### تشغيل عادي
```bash
python3 backend/server.py
```

#### تشغيل محسن
```bash
./run_optimized.sh
```

#### تشغيل مع Docker
```bash
docker-compose up -d
```

### 4. اختبار الواجهة

#### فتح المتصفح
```
http://localhost:8000
```

#### اختبار API
```bash
# Health check
curl http://localhost:8000/health

# API status
curl http://localhost:8000/api/status

# Test data
curl http://localhost:8000/api/customers
```

## 🔧 استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ في قاعدة البيانات
```
Error: connection failed
```
**الحل**: تحقق من DATABASE_URL في .env

#### 2. خطأ في التبعيات
```
ModuleNotFoundError
```
**الحل**: تأكد من تثبيت requirements.txt

#### 3. خطأ في CORS
```
CORS policy error
```
**الحل**: تحقق من ALLOWED_ORIGINS

### Logs مفيدة
```bash
# عرض logs
tail -f logs/app.log

# أخطاء قاعدة البيانات
grep "database" logs/app.log

# أخطاء API
grep "API Error" logs/app.log
```

## 📊 مراقبة الأداء

### Health Check
```bash
curl http://localhost:8000/health
```

### API Status
```bash
curl http://localhost:8000/api/status
```

### Database Status
```bash
python3 -c "
from backend.server import app, db
with app.app_context():
    print('Database URL:', app.config['SQLALCHEMY_DATABASE_URI'][:50])
    result = db.session.execute('SELECT version()').fetchone()
    print('PostgreSQL version:', result[0])
"
```

## 🚀 النشر على Render

### 1. رفع الكود
```bash
git add .
git commit -m "Update database connection"
git push origin main
```

### 2. إعداد Render
- إنشاء Web Service
- ربط قاعدة البيانات
- إضافة متغيرات البيئة

### 3. متغيرات البيئة في Render
```
DATABASE_URL=postgresql://neondb_owner:npg_oJCB7e5ajzYO@ep-cold-mode-advs9k91-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
FLASK_ENV=production
SECRET_KEY=your-secret-key
LOG_LEVEL=INFO
```

## 🎯 النتيجة

✅ **اتصال قاعدة البيانات محدث**  
✅ **إعدادات Render محسنة**  
✅ **اختبارات محلية متاحة**  
✅ **نشر سهل على Render**  

**البرنامج جاهز للاختبار والنشر! 🎉**