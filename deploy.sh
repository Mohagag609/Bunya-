#!/bin/bash

# سكريبت النشر - نسخ ملفات واجهة المستخدم إلى الجذر

echo "🚀 بدء عملية النشر..."

# نسخ ملفات واجهة المستخدم إلى الجذر
echo "📁 نسخ ملفات واجهة المستخدم..."
cp frontend/index.html .
cp -r frontend/css .
cp -r frontend/js .
cp -r frontend/components .
cp frontend/manifest.json .
cp frontend/sw.js .

# نسخ ملفات التصدير
cp frontend/export.html .

echo "✅ تم نسخ جميع الملفات بنجاح"
echo "🎯 المشروع جاهز للنشر على Render.com"

# اختبار محلي (اختياري)
if [ "$1" = "--test" ]; then
    echo "🧪 اختبار التشغيل المحلي..."
    python3 server.py &
    SERVER_PID=$!
    sleep 3
    curl -s http://localhost:8000/health
    kill $SERVER_PID
    echo "✅ الاختبار المحلي مكتمل"
fi

echo "🚀 جاهز للنشر!"