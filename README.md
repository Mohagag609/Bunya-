# 🏢 نظام إدارة العقارات

نظام شامل لإدارة العقارات والعقود والعملاء مع واجهة مستخدم حديثة.

## 📁 هيكل المشروع

```
├── frontend/                 # واجهة المستخدم
│   ├── css/                 # ملفات التنسيق
│   ├── js/                  # ملفات JavaScript
│   ├── components/          # مكونات واجهة المستخدم
│   └── assets/             # الصور والملفات الثابتة
├── backend/                 # الخادم الخلفي
│   ├── models.py           # نماذج قاعدة البيانات
│   ├── server.py           # الخادم الرئيسي
│   └── requirements.txt    # متطلبات Python
├── config/                  # ملفات الإعداد
│   ├── deployment/         # إعدادات النشر
│   └── database/           # إعدادات قاعدة البيانات
├── docs/                    # الوثائق
│   ├── guides/             # أدلة الاستخدام
│   ├── troubleshooting/    # حل المشاكل
│   └── api/                # وثائق API
├── scripts/                 # سكريبتات التشغيل
├── tests/                   # ملفات الاختبار
└── archive/                 # الأرشيف
    ├── old-versions/       # النسخ القديمة
    └── experiments/        # التجارب
```

## 🚀 البدء السريع

### 1. تثبيت المتطلبات

```bash
# تثبيت متطلبات Python
pip install -r config/database/requirements.txt

# تثبيت متطلبات Node.js (إذا لزم الأمر)
npm install
```

### 2. إعداد قاعدة البيانات

```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل إعدادات قاعدة البيانات في .env
# تشغيل قاعدة البيانات
python backend/server.py
```

### 3. تشغيل التطبيق

```bash
# تشغيل الخادم الخلفي
python backend/server.py

# فتح المتصفح على
http://localhost:5000
```

## 🛠️ الميزات

- ✅ إدارة العملاء والوحدات
- ✅ إدارة العقود والأقساط
- ✅ نظام التقارير والإحصائيات
- ✅ واجهة مستخدم حديثة ومتجاوبة
- ✅ دعم النسخ الاحتياطي
- ✅ نظام البحث الذكي
- ✅ إشعارات النظام

## 📚 الوثائق

- [دليل التثبيت](docs/guides/README_MODERN.md)
- [دليل النشر](docs/guides/RENDER_DEPLOYMENT.md)
- [حل المشاكل](docs/troubleshooting/TROUBLESHOOTING.md)
- [دليل API](docs/api/)

## 🔧 التطوير

### إضافة ميزة جديدة

1. إنشاء فرع جديد
2. تطوير الميزة
3. كتابة الاختبارات
4. إرسال Pull Request

### تشغيل الاختبارات

```bash
python -m pytest tests/
```

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🤝 المساهمة

نرحب بمساهماتكم! راجع [دليل المساهمة](docs/guides/CONTRIBUTING.md) للبدء.

## 📞 الدعم

إذا واجهت أي مشاكل، راجع [دليل حل المشاكل](docs/troubleshooting/TROUBLESHOOTING.md) أو أنشئ issue جديد.

---

**ملاحظة**: تأكد من قراءة ملف `.env.example` وتكوين متغيرات البيئة المناسبة قبل التشغيل.