# مدير الاستثمار العقاري - النسخة الحديثة

## نظرة عامة

نظام إدارة الاستثمار العقاري المحدث بتصميم SaaS حديث يدعم الواجهات المتجاوبة، الثيمات الداكنة/الفاتحة، دعم RTL كامل، ونظام إشعارات متقدم.

## المميزات الجديدة

### 🎨 تصميم حديث
- نظام ألوان متسق ومتطور
- دعم كامل للثيمات الداكنة والفاتحة
- دعم RTL و LTR
- واجهة متجاوبة لجميع الأجهزة

### 🔔 نظام الإشعارات
- توستات غير حاجزة
- أنواع متعددة (نجاح، خطأ، تحذير، معلومة)
- إخفاء تلقائي قابل للتخصيص
- دعم الإشعارات المتعددة

### ⚡ تحسينات الأداء
- تحميل كسول للصور والمحتوى
- تحسين عرض الجداول الكبيرة
- تقليل إعادة الرسم
- إدارة ذكية للذاكرة

### 🎭 حالات التحميل
- سكيلتون تحميل للجداول والبطاقات
- حالات فارغة واضحة
- مؤشرات تحميل متقدمة

## بنية المشروع

```
workspace/
├── src/                          # الكود المحدث
│   ├── components/               # مكونات النظام
│   │   ├── theme-system.js      # نظام الثيمات
│   │   ├── toast-system.js      # نظام الإشعارات
│   │   └── skeleton-system.js   # نظام السكيلتون
│   ├── styles/                   # أنماط التصميم
│   │   ├── design-system.css    # نظام التصميم الأساسي
│   │   ├── components.css       # أنماط المكونات
│   │   └── layout.css           # أنماط التخطيط
│   ├── ui/                      # واجهة المستخدم
│   │   └── modern-ui-updater.js # محدث الواجهة
│   └── utils/                   # أدوات مساعدة
│       └── performance-optimizer.js # محسن الأداء
├── docs/                        # الوثائق
├── config/                      # ملفات الإعداد
├── archive/                     # الأرشيف
└── index.html                   # الملف الرئيسي
```

## التثبيت والتشغيل

### المتطلبات
- Python 3.8+
- متصفح حديث يدعم ES6+
- Node.js 14+ (للتطوير)

### التشغيل المحلي
```bash
# تشغيل خادم محلي بسيط
python -m http.server 8000

# أو باستخدام Node.js
npm start

# أو باستخدام serve
npx serve .
```

### التشغيل مع Docker
```bash
# بناء الصورة
docker build -f Dockerfile.modern -t real-estate-manager-modern .

# تشغيل الحاوية
docker run -p 8000:8000 real-estate-manager-modern

# أو باستخدام docker-compose
docker-compose -f docker-compose.modern.yml up -d
```

### التطوير
```bash
# تثبيت التبعيات
npm install

# بناء الملفات
npm run build

# اختبار الواجهة
open test-modern-ui.html
```

## الاستخدام

### تغيير الثيم
```javascript
// تغيير إلى الثيم الداكن
window.theme.setTheme('dark');

// تغيير إلى الثيم الفاتح
window.theme.setTheme('light');

// التبديل بين الثيمات
window.theme.toggleTheme();
```

### تغيير الاتجاه
```javascript
// تغيير إلى RTL
window.theme.setDirection('rtl');

// تغيير إلى LTR
window.theme.setDirection('ltr');

// التبديل بين الاتجاهات
window.theme.toggleDirection();
```

### عرض الإشعارات
```javascript
// إشعار نجاح
window.toast.success('تم الحفظ بنجاح');

// إشعار خطأ
window.toast.error('حدث خطأ في الحفظ');

// إشعار تحذير
window.toast.warning('تحذير: البيانات غير مكتملة');

// إشعار معلومة
window.toast.info('معلومة: تم تحديث البيانات');

// إشعار مخصص
window.toast.show('رسالة مخصصة', {
  type: 'info',
  title: 'عنوان الإشعار',
  duration: 5000,
  closable: true
});
```

### إضافة سكيلتون التحميل
```javascript
// سكيلتون للجدول
const skeletonId = window.skeleton.show(container, 'table', {
  rows: 5,
  columns: 4
});

// إخفاء السكيلتون
window.skeleton.hide(skeletonId);

// سكيلتون لبطاقات KPI
const kpiSkeletonId = window.skeleton.show(container, 'kpi', {
  count: 4
});
```

## التخصيص

### تخصيص الألوان
يمكن تخصيص نظام الألوان من خلال تعديل المتغيرات في `src/styles/design-system.css`:

```css
:root {
  --primary-500: #6366f1;    /* اللون الأساسي */
  --success-500: #22c55e;    /* لون النجاح */
  --error-500: #ef4444;      /* لون الخطأ */
  --warning-500: #f59e0b;    /* لون التحذير */
}
```

### تخصيص المسافات
```css
:root {
  --space-4: 1rem;           /* المسافة الأساسية */
  --space-6: 1.5rem;         /* المسافة المتوسطة */
  --space-8: 2rem;           /* المسافة الكبيرة */
}
```

### تخصيص الخطوط
```css
:root {
  --font-family: 'Cairo', sans-serif;
  --font-size-base: 1rem;
  --font-weight-normal: 400;
}
```

## الأداء

### مؤشرات الأداء
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### تحسينات الأداء المطبقة
- تحميل كسول للصور
- تحسين عرض الجداول الكبيرة
- تقليل إعادة الرسم
- إدارة ذكية للذاكرة
- ضغط الأصول

## المتصفحات المدعومة

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

للحصول على الدعم، يرجى فتح issue في GitHub أو التواصل مع فريق التطوير.

## التحديثات المستقبلية

- [ ] دعم PWA كامل
- [ ] وضع عدم الاتصال
- [ ] مزامنة البيانات
- [ ] تقارير متقدمة
- [ ] واجهة API

---

تم تطوير هذا المشروع بواسطة فريق التطوير باستخدام أحدث التقنيات وأفضل الممارسات في تطوير الواجهات.