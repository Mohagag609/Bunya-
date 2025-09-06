# استخدام Python 3.9 كصورة أساسية
FROM python:3.9-slim

# تعيين متغيرات البيئة
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=backend/server.py
ENV FLASK_ENV=production

# تعيين مجلد العمل
WORKDIR /app

# تثبيت متطلبات النظام
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# نسخ ملفات المتطلبات
COPY config/database/requirements.txt .

# تثبيت متطلبات Python
RUN pip install --no-cache-dir -r requirements.txt

# نسخ ملفات التطبيق
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY config/ ./config/

# إنشاء مجلدات مطلوبة
RUN mkdir -p logs uploads

# تعيين الصلاحيات
RUN chmod +x scripts/*.sh

# فتح المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["python", "backend/server.py"]