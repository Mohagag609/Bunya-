# 🏛️ مدير الاستثمار العقاري - النسخة المحدثة

نظام إدارة الاستثمار العقاري الحديث والمتطور، مكتوب بأحدث التقنيات مع واجهة مستخدم عصرية وتجربة مستخدم محسنة.

## ✨ المميزات الجديدة

### 🎨 واجهة مستخدم حديثة
- تصميم عصري ومتجاوب مع جميع الأجهزة
- دعم كامل للوضع المظلم والفاتح
- رسوم بيانية تفاعلية باستخدام Chart.js
- إشعارات ذكية ومؤثرات بصرية جذابة

### 🚀 تقنيات حديثة
- **Frontend**: TypeScript, ES6+ Modules, Vite
- **Backend**: Flask مع SQLAlchemy محسن
- **Database**: PostgreSQL (Neon) مع دعم JSONB
- **PWA**: تطبيق ويب تقدمي مع دعم العمل بدون إنترنت

### 📊 إدارة شاملة
- **العملاء**: إدارة كاملة لبيانات العملاء
- **الوحدات**: تتبع الوحدات العقارية وحالاتها
- **العقود**: إدارة العقود والأقساط
- **الشركاء**: إدارة الشركاء والمجموعات
- **الخزائن**: تتبع الأموال والتحويلات
- **التقارير**: تقارير تفصيلية ورسوم بيانية

## 🚀 النشر على Render

### المتطلبات
- حساب على [Render.com](https://render.com)
- قاعدة بيانات Neon (معدة بالفعل)
- GitHub repository

### خطوات سريعة

1. **انشر Backend**:
   - اذهب إلى Render Dashboard
   - اختر "Web Service"
   - استخدم `render.yaml` للإعدادات

2. **انشر Frontend**:
   - اختر "Static Site"
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

3. **اختبار**:
   - Backend: `https://your-backend.onrender.com/api/health`
   - Frontend: `https://your-frontend.onrender.com`

## 🔧 التطوير المحلي

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

## 📱 PWA Features

- **تثبيت التطبيق**: يمكن تثبيت التطبيق على الجهاز
- **العمل بدون إنترنت**: دعم العمل في وضع عدم الاتصال
- **الإشعارات**: إشعارات push للأحداث المهمة
- **التحديث التلقائي**: تحديث البيانات تلقائياً عند الاتصال

## 🔐 الأمان

- HTTPS تلقائي على Render
- قاعدة بيانات محمية بكلمة مرور
- CORS محدود للنطاقات المسموحة
- معالجة أخطاء شاملة

## 📊 API Endpoints

### العملاء
- `GET /api/customers` - جلب جميع العملاء
- `POST /api/customers/{id}` - إنشاء/تحديث عميل
- `DELETE /api/customers/{id}` - حذف عميل

### الوحدات
- `GET /api/units` - جلب جميع الوحدات
- `POST /api/units/{id}` - إنشاء/تحديث وحدة
- `DELETE /api/units/{id}` - حذف وحدة

### العقود
- `GET /api/contracts` - جلب جميع العقود
- `POST /api/contracts/{id}` - إنشاء/تحديث عقد
- `DELETE /api/contracts/{id}` - حذف عقد

### الخزائن
- `GET /api/safes` - جلب جميع الخزائن
- `POST /api/safes/{id}` - إنشاء/تحديث خزنة
- `DELETE /api/safes/{id}` - حذف خزنة

### الصحة
- `GET /api/health` - فحص حالة الخادم

## 🛠️ إعدادات قاعدة البيانات

```bash
DATABASE_URL=postgresql://neondb_owner:npg_mCShrFRbkc16@ep-small-salad-ad85fh4s-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 📈 المراقبة

- **Health Check**: `/api/health`
- **Logs**: متاحة في Render Dashboard
- **Metrics**: CPU, Memory, Response Time
- **Uptime**: مراقبة تلقائية

## 🔄 التحديثات

عند إجراء تغييرات:
1. ادفع التغييرات إلى GitHub
2. Render سيقوم بإعادة النشر تلقائياً

## 🐛 استكشاف الأخطاء

### مشاكل شائعة:
1. **Build Failed**: تحقق من logs في Render
2. **Database Error**: تحقق من `DATABASE_URL`
3. **CORS Error**: تحقق من إعدادات CORS
4. **Frontend Not Loading**: تحقق من `Publish Directory`

## 📞 الدعم

للحصول على الدعم:
- أنشئ issue في GitHub
- راجع logs في Render Dashboard
- تحقق من `RENDER_DEPLOY.md` للتفاصيل

---

**🎉 تم تطويره بـ ❤️ باستخدام أحدث التقنيات**

**جاهز للنشر على Render! 🚀**