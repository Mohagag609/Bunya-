#!/bin/bash

echo "🚀 إعداد التطبيق للنشر على Netlify"
echo "=================================="

# التحقق من وجود الملفات المطلوبة
echo "📋 التحقق من الملفات المطلوبة..."

required_files=(
    "index.html"
    "app.js"
    "sql-db-complete.js"
    "style.css"
    "manifest.json"
    "sw.js"
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
    echo "❌ الملفات المفقودة:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ جميع الملفات المطلوبة موجودة"

# إنشاء مجلد النشر
echo "📁 إنشاء مجلد النشر..."
rm -rf dist
mkdir -p dist

# نسخ الملفات
echo "📋 نسخ الملفات..."
cp index.html dist/
cp app.js dist/
cp sql-db-complete.js dist/
cp style.css dist/
cp manifest.json dist/
cp sw.js dist/
cp netlify.toml dist/
cp _redirects dist/
cp _headers dist/
cp package.json dist/

echo "✅ تم إعداد الملفات بنجاح"
echo ""
echo "🌐 طرق النشر على Netlify:"
echo "=========================="
echo ""
echo "1️⃣ النشر اليدوي (الأسرع):"
echo "   - اذهب إلى https://app.netlify.com"
echo "   - اسحب مجلد 'dist' إلى منطقة النشر"
echo "   - انتظر حتى يكتمل النشر"
echo ""
echo "2️⃣ النشر عبر Git:"
echo "   - ارفع الملفات إلى GitHub"
echo "   - اربط المستودع مع Netlify"
echo "   - Netlify سيقوم بالنشر التلقائي"
echo ""
echo "3️⃣ النشر عبر Netlify CLI:"
echo "   npm install -g netlify-cli"
echo "   netlify deploy --dir=dist --prod"
echo ""
echo "📁 مجلد النشر: dist/"
echo "🔗 بعد النشر: https://your-site-name.netlify.app"
echo ""
echo "✨ تم إعداد التطبيق بنجاح!"