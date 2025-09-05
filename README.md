# نظام إدارة الاستثمار العقاري 🏛️

نظام شامل لإدارة الاستثمارات العقارية مع قاعدة بيانات SQL متقدمة.

## المميزات ✨

- 📊 **لوحة تحكم شاملة** - إحصائيات ومؤشرات الأداء
- 👥 **إدارة العملاء** - قاعدة بيانات عملاء متكاملة
- 🏠 **إدارة الوحدات** - تتبع الوحدات العقارية وحالاتها
- 🤝 **إدارة الشركاء** - نظام شراكة متقدم
- 📋 **إدارة العقود** - عقود مبيعات وإيجار
- 💰 **إدارة الأقساط** - تتبع المدفوعات والمتأخرات
- 🏦 **إدارة الخزائن** - تتبع التدفقات النقدية
- 📈 **تقارير متقدمة** - تقارير شاملة وقابلة للتصدير
- 🔒 **أمان متقدم** - تشفير وحماية البيانات

## التقنيات المستخدمة 🛠️

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite مع SQL.js
- **Charts**: Chart.js
- **Export**: XLSX.js للتصدير
- **PWA**: Service Worker للعمل بدون إنترنت

## النشر على Netlify 🚀

### الطريقة الأولى: النشر المباشر

1. **تحضير الملفات:**
   ```bash
   # تأكد من وجود جميع الملفات
   ls -la
   ```

2. **رفع الملفات:**
   - اذهب إلى [netlify.com](https://netlify.com)
   - سجل دخول أو أنشئ حساب
   - اضغط "New site from Git"
   - اختر "Deploy manually"
   - اسحب وأفلت مجلد المشروع

### الطريقة الثانية: النشر عبر Git

1. **إنشاء مستودع Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Estate Management System"
   git branch -M main
   git remote add origin https://github.com/your-username/estate-management-system.git
   git push -u origin main
   ```

2. **ربط مع Netlify:**
   - اذهب إلى Netlify Dashboard
   - اضغط "New site from Git"
   - اختر GitHub/GitLab
   - اختر المستودع
   - اضغط "Deploy site"

### الطريقة الثالثة: Netlify CLI

1. **تثبيت Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **تسجيل الدخول:**
   ```bash
   netlify login
   ```

3. **النشر:**
   ```bash
   netlify deploy
   netlify deploy --prod
   ```

## إعدادات النشر ⚙️

### متغيرات البيئة (اختيارية)
```bash
# في Netlify Dashboard > Site settings > Environment variables
NODE_ENV=production
APP_VERSION=2.0.0
```

### إعدادات البناء
- **Build command**: `echo 'No build step required'`
- **Publish directory**: `.` (root)
- **Node version**: `18`

## الملفات المهمة 📁

```
├── index.html              # الصفحة الرئيسية
├── app-sql.js             # التطبيق الرئيسي مع SQL
├── sql-db-complete.js     # مكتبة قاعدة البيانات
├── style.css              # التصميم
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── migrate-to-sql.html    # أداة التحويل
├── netlify.toml           # إعدادات Netlify
├── _redirects             # توجيهات URL
└── package.json           # معلومات المشروع
```

## الاستخدام 📖

### للمستخدمين الجدد:
1. افتح الموقع
2. ابدأ بإضافة العملاء والوحدات
3. أنشئ العقود والأقساط
4. استخدم التقارير لمتابعة الأداء

### للمستخدمين القدامى:
1. افتح `/migrate-to-sql.html`
2. اضغط "بدء التحويل"
3. انتظر اكتمال العملية
4. استخدم النسخة الجديدة

## الدعم التقني 🆘

### مشاكل شائعة:

1. **خطأ في تحميل SQL.js:**
   - تحقق من الاتصال بالإنترنت
   - امسح cache المتصفح

2. **فشل في التحويل:**
   - تحقق من وجود البيانات في localStorage
   - استخدم أداة التحويل مرة أخرى

3. **بطء في الأداء:**
   - استخدم متصفح حديث
   - تأكد من تفعيل JavaScript

### الحصول على المساعدة:
- تحقق من سجل الأخطاء في وحدة التحكم
- استخدم أداة التحويل لإعادة تحويل البيانات
- استخدم النسخ الاحتياطي لاستعادة البيانات

## التطوير 🔧

### التطوير المحلي:
```bash
# تثبيت التبعيات
npm install

# تشغيل الخادم المحلي
npm run dev

# فتح المتصفح
open http://localhost:3000
```

### إضافة ميزات جديدة:
1. عدّل الملفات المطلوبة
2. اختبر التغييرات محلياً
3. ارفع التغييرات إلى Git
4. Netlify سيقوم بالنشر التلقائي

## الترخيص 📄

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## المساهمة 🤝

نرحب بالمساهمات! يرجى:
1. عمل Fork للمشروع
2. إنشاء branch للميزة الجديدة
3. عمل commit للتغييرات
4. عمل Pull Request

---

**تم التطوير بـ ❤️ للمجتمع العربي**