#!/bin/bash

# Netlify Deployment Script
# تشغيل: bash deploy.sh

echo "🚀 بدء النشر على Netlify..."
echo "=================================="

# التحقق من وجود الملفات المطلوبة
echo "📋 التحقق من الملفات المطلوبة..."

required_files=(
    "index.html"
    "app-sql.js"
    "sql-db-complete.js"
    "style.css"
    "manifest.json"
    "sw.js"
    "migrate-to-sql.html"
    "netlify.toml"
    "_redirects"
    "_headers"
    "package.json"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ ملفات مفقودة:"
    printf '%s\n' "${missing_files[@]}"
    echo ""
    echo "يرجى التأكد من وجود جميع الملفات المطلوبة"
    exit 1
fi

echo "✅ جميع الملفات موجودة"
echo ""

# إنشاء نسخة احتياطية
echo "💾 إنشاء نسخة احتياطية..."
if [ -d ".git" ]; then
    git add .
    git commit -m "Deploy to Netlify - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ تم حفظ التغييرات في Git"
else
    echo "⚠️  لم يتم العثور على Git repository"
    echo "💡 يمكنك إنشاء Git repository بـ: git init"
fi

echo ""

# فحص الملفات
echo "🔍 فحص الملفات..."
echo "📄 الملفات الرئيسية:"
ls -la *.html *.js *.css *.json 2>/dev/null | head -10

echo ""
echo "📁 ملفات التكوين:"
ls -la netlify.toml _redirects _headers 2>/dev/null

echo ""

# عرض تعليمات النشر
echo "🎯 خطوات النشر على Netlify:"
echo "=================================="
echo "1. 🌐 اذهب إلى https://netlify.com"
echo "2. 🔐 سجل دخول أو أنشئ حساب"
echo "3. ➕ اضغط 'New site from Git'"
echo "4. 📁 اختر 'Deploy manually'"
echo "5. 🖱️  اسحب مجلد المشروع إلى المنطقة المحددة"
echo "6. ⏳ انتظر حتى اكتمال النشر"
echo "7. 🎉 احصل على الرابط الجديد!"
echo ""

# نصائح إضافية
echo "💡 نصائح مهمة:"
echo "=================================="
echo "✅ تأكد من تفعيل HTTPS"
echo "✅ اختبر التطبيق بعد النشر"
echo "✅ احفظ الرابط في مكان آمن"
echo "✅ استخدم أداة التحويل إذا كان لديك بيانات قديمة"
echo ""

# معلومات إضافية
echo "📊 معلومات المشروع:"
echo "=================================="
echo "📱 نوع التطبيق: PWA (Progressive Web App)"
echo "🗄️  قاعدة البيانات: SQLite مع SQL.js"
echo "🌍 اللغة: العربية (RTL)"
echo "📱 متوافق مع: جميع المتصفحات الحديثة"
echo ""

# روابط مفيدة
echo "🔗 روابط مفيدة:"
echo "=================================="
echo "📖 دليل النشر: NETLIFY-DEPLOY.md"
echo "🛠️  أداة التحويل: /migrate-to-sql.html"
echo "📋 الملفات المطلوبة: README.md"
echo ""

echo "🎉 تم التحضير بنجاح!"
echo "🚀 جاهز للنشر على Netlify!"
echo "=================================="