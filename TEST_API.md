# 🧪 اختبار API - مدير الاستثمار العقاري

## ✅ API يعمل بنجاح!

### 🔗 الروابط:

- **Backend**: `https://estate-manager-backend-vwop.onrender.com`
- **Health Check**: `https://estate-manager-backend-vwop.onrender.com/api/health`
- **API Base**: `https://estate-manager-backend-vwop.onrender.com/api`

### 📊 API Endpoints المتاحة:

#### 1. Health Check
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/health
```

#### 2. العملاء
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/customers
```

#### 3. الوحدات
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/units
```

#### 4. العقود
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/contracts
```

#### 5. الخزائن
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/safes
```

#### 6. الشركاء
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/partners
```

#### 7. التحويلات
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/transfers
```

#### 8. السندات
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/vouchers
```

### 🔧 إضافة بيانات جديدة:

#### إضافة عميل:
```bash
curl -X PUT https://estate-manager-backend-vwop.onrender.com/api/customers/CUST_001 \
  -H "Content-Type: application/json" \
  -d '{"id": "CUST_001", "name": "أحمد محمد", "phone": "01234567890"}'
```

#### إضافة وحدة:
```bash
curl -X PUT https://estate-manager-backend-vwop.onrender.com/api/units/UNIT_001 \
  -H "Content-Type: application/json" \
  -d '{"id": "UNIT_001", "name": "شقة 101", "building": "المبنى أ", "floor": 1, "area": 120, "price": 500000, "status": "available"}'
```

#### إضافة خزنة:
```bash
curl -X PUT https://estate-manager-backend-vwop.onrender.com/api/safes/SAFE_001 \
  -H "Content-Type: application/json" \
  -d '{"id": "SAFE_001", "name": "خزنة فرعية", "balance": 10000}'
```

### 🎯 Frontend Configuration:

في `src/services/api.ts`:
```typescript
const API_BASE_URL = 'https://estate-manager-backend-vwop.onrender.com/api';
```

### 🔍 استكشاف الأخطاء:

#### إذا حصلت على 502:
- انتظر قليلاً (Render قد يعيد تشغيل الخادم)
- جرب مرة أخرى

#### إذا حصلت على 405:
- تأكد من استخدام PUT method
- تأكد من إرسال Content-Type: application/json

#### إذا حصلت على CORS error:
- تم إصلاح CORS في الخادم
- جرب مرة أخرى

### 📱 اختبار Frontend:

1. افتح `index.html` في المتصفح
2. افتح Developer Tools (F12)
3. اذهب إلى Console
4. يجب أن ترى: "OBJECT_STORES defined"
5. يجب أن ترى: "Database connection successful"

---

**🎉 API جاهز ويعمل بنجاح!**