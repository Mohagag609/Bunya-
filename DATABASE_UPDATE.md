# 🔄 تحديث قاعدة البيانات - مدير الاستثمار العقاري

## ✅ تم تحديث قاعدة البيانات بنجاح!

### 🔗 قاعدة البيانات الجديدة:
```
postgresql://neondb_owner:npg_mCShrFRbkc16@ep-small-salad-ad85fh4s-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 📁 الملفات المحدثة:

#### 1. `server.py`:
- ✅ DATABASE_URL محدث
- ✅ CORS origins محدثة
- ✅ إضافة النطاقات الجديدة

#### 2. `render.yaml`:
- ✅ DATABASE_URL محدث
- ✅ إعدادات Render محدثة

#### 3. `src/services/api.ts`:
- ✅ API_BASE_URL محدث

### 🌐 النطاقات المدعومة:

#### Development:
- `http://localhost:3000`
- `http://localhost:8000`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8000`

#### Production:
- `https://estate-manager-backend-vwop.onrender.com`
- `https://estate-manager-frontend.onrender.com`

### 🔧 اختبار الاتصال:

#### 1. Health Check:
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/health
```

#### 2. اختبار قاعدة البيانات:
```bash
curl https://estate-manager-backend-vwop.onrender.com/api/safes
```

#### 3. اختبار CORS:
```bash
curl -H "Origin: https://estate-manager-frontend.onrender.com" \
     https://estate-manager-backend-vwop.onrender.com/api/health
```

### 📊 البيانات الموجودة:

#### الخزائن:
- الخزنة الرئيسية (S_main) - 0 ج.م

#### الجداول المتاحة:
- customers (العملاء)
- units (الوحدات)
- partners (الشركاء)
- contracts (العقود)
- safes (الخزائن)
- transfers (التحويلات)
- vouchers (السندات)
- brokers (الوسطاء)
- installments (الأقساط)
- auditLog (سجل التدقيق)
- settings (الإعدادات)

### 🚀 الخطوة التالية:

الآن يمكنك:

1. **اختبار Frontend محلياً**:
   ```bash
   npm run dev
   ```

2. **نشر Frontend على Render**:
   - اختر "Static Site"
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Redirects: `/api/*` → `https://estate-manager-backend-vwop.onrender.com/api/*`

### 🔍 استكشاف الأخطاء:

#### إذا حصلت على خطأ في قاعدة البيانات:
- تحقق من DATABASE_URL
- تأكد من أن قاعدة بيانات Neon تعمل

#### إذا حصلت على CORS error:
- تحقق من أن النطاق مضاف في allowed_origins
- تأكد من إرسال Origin header

#### إذا حصلت على 502 Bad Gateway:
- انتظر قليلاً (Render قد يعيد تشغيل الخادم)
- جرب مرة أخرى

---

**🎉 قاعدة البيانات محدثة وجاهزة للاستخدام!**