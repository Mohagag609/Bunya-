# 🔍 تشخيص خطأ Internal Server Error

## ❌ المشكلة

### خطأ Internal Server Error
```
Internal server error
```

### الأسباب المحتملة
1. خطأ في قاعدة البيانات
2. خطأ في imports
3. خطأ في middleware
4. خطأ في CORS
5. خطأ في static files

## 🔧 خطوات التشخيص

### 1. فحص Logs في Render
```bash
# في Render Dashboard
Dashboard → Logs

# أو باستخدام CLI
render logs --service your-service-name
```

### 2. اختبار Health Check
```bash
curl https://your-app.onrender.com/health
```

### 3. اختبار API Status
```bash
curl https://your-app.onrender.com/api/status
```

### 4. اختبار Static Files
```bash
curl https://your-app.onrender.com/
```

## ✅ الحلول

### الحل 1: استخدام server_simple.py (مستحسن)
```yaml
# render.yaml
startCommand: python backend/server_simple.py
```

### الحل 2: إزالة middleware معقد
```python
# إزالة before_request و after_request
# استخدام خادم بسيط
```

### الحل 3: إصلاح CORS
```python
# في server.py
CORS(app, origins="*", methods=["GET", "PUT", "POST", "DELETE"])
```

### الحل 4: إصلاح static files
```python
# في server.py
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')
```

## 🚀 خطوات الإصلاح

### 1. إنشاء خادم بسيط جداً
```python
# server_minimal.py
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/')
def index():
    return "Estate Manager is running!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

### 2. اختبار الخادم البسيط
```bash
python backend/server_minimal.py
curl http://localhost:8000/health
```

### 3. نشر الخادم البسيط
```yaml
# render-minimal.yaml
startCommand: python backend/server_minimal.py
```

## 📋 قائمة التحقق

### قبل النشر
- [ ] الخادم يعمل محلياً
- [ ] Health check يعمل
- [ ] لا توجد أخطاء في logs
- [ ] CORS يعمل

### بعد النشر
- [ ] Health check يعمل على Render
- [ ] لا توجد أخطاء في Render logs
- [ ] التطبيق يفتح في المتصفح
- [ ] API endpoints تستجيب

## 🔍 استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ في قاعدة البيانات
```
Database connection failed
```
**الحل**: تحقق من DATABASE_URL

#### 2. خطأ في CORS
```
CORS policy error
```
**الحل**: استخدم `CORS(app, origins="*")`

#### 3. خطأ في static files
```
File not found
```
**الحل**: تحقق من static_folder path

#### 4. خطأ في imports
```
ModuleNotFoundError
```
**الحل**: تحقق من requirements.txt

## 🎯 التوصية

### للاستخدام الفوري
1. **استخدم server_minimal.py**
2. **اختبر محلياً أولاً**
3. **انشر على Render**
4. **تحقق من Health Check**

### للاستخدام المتقدم
1. **أضف الوظائف تدريجياً**
2. **اختبر كل إضافة**
3. **راقب logs باستمرار**

## ✅ النتيجة

✅ **تشخيص المشكلة** - خطوات واضحة  
✅ **حلول متعددة** - من البسيط للمعقد  
✅ **اختبار محلي** - قبل النشر  
✅ **مراقبة مستمرة** - logs و health check  
✅ **نشر آمن** - خطوات مدروسة  

**اتبع الخطوات خطوة بخطوة! 🎉**