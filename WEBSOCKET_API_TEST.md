# WebSocket & API Sync Test Guide

## المشكلة المطلوب حلها:
1. **WebSocket /ws** يرجع 400 Bad Request
2. **POST /api/sync** يرجع 405 Method Not Allowed

## الحلول المطبقة:

### 1. WebSocket Support
- ✅ إضافة Flask-SocketIO للخادم
- ✅ إضافة WebSocket handlers (connect, disconnect, sync_request)
- ✅ إضافة Socket.IO client في الواجهة الأمامية
- ✅ إضافة WebSocket route `/ws`

### 2. API Sync Support
- ✅ إضافة POST endpoint `/api/sync`
- ✅ إضافة sync functions في JavaScript
- ✅ إضافة WebSocket sync events

## ملفات الاختبار:

### 1. اختبار WebSocket
```bash
# اختبار يدوي بـ curl
./test_curl.sh

# أو افتح في المتصفح
http://localhost:8000/test_websocket.html
```

### 2. اختبار API Sync
```bash
# اختبار يدوي بـ curl
curl -X POST http://localhost:8000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"message": "Hello"}}'

# أو افتح في المتصفح
http://localhost:8000/test_api_sync.html
```

### 3. اختبار Health Check
```bash
curl http://localhost:8000/health
```

## المتطلبات الجديدة:
- `Flask-SocketIO==5.3.6`
- `python-socketio==5.9.0` (dependency)

## إعدادات Render:
- إضافة `FLASK_SOCKETIO_ASYNC_MODE=threading`
- تحديث `requirements-py311.txt`

## اختبار التكامل:
1. تشغيل الخادم: `python backend/server_working.py`
2. فتح `http://localhost:8000/test_websocket.html`
3. فتح `http://localhost:8000/test_api_sync.html`
4. تشغيل `./test_curl.sh`

## النتائج المتوقعة:
- ✅ WebSocket connection successful (101 Switching Protocols)
- ✅ POST /api/sync returns 200 OK
- ✅ Health check returns 200 OK
- ✅ Real-time sync between clients

## استكشاف الأخطاء:
- تحقق من console logs للخادم
- تحقق من Network tab في المتصفح
- تحقق من CORS settings
- تحقق من proxy configuration (إذا كان موجود)