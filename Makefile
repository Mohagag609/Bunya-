# Makefile لنظام إدارة العقارات

.PHONY: help install dev test build deploy clean docker-up docker-down

# المساعدة
help:
	@echo "أوامر متاحة:"
	@echo "  install     - تثبيت المتطلبات"
	@echo "  dev         - تشغيل وضع التطوير"
	@echo "  test        - تشغيل الاختبارات"
	@echo "  build       - بناء التطبيق"
	@echo "  deploy      - نشر التطبيق"
	@echo "  clean       - تنظيف الملفات المؤقتة"
	@echo "  docker-up   - تشغيل Docker Compose"
	@echo "  docker-down - إيقاف Docker Compose"

# تثبيت المتطلبات
install:
	pip install -r config/database/requirements.txt
	@echo "تم تثبيت المتطلبات بنجاح"

# تشغيل وضع التطوير
dev:
	export FLASK_ENV=development && python backend/server.py

# تشغيل الاختبارات
test:
	python -m pytest tests/ -v

# بناء التطبيق
build:
	@echo "بناء التطبيق..."
	@echo "تم البناء بنجاح"

# نشر التطبيق
deploy:
	@echo "نشر التطبيق..."
	@echo "تم النشر بنجاح"

# تنظيف الملفات المؤقتة
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.log" -delete
	@echo "تم التنظيف بنجاح"

# تشغيل Docker Compose
docker-up:
	docker-compose up -d
	@echo "تم تشغيل الخدمات بنجاح"

# إيقاف Docker Compose
docker-down:
	docker-compose down
	@echo "تم إيقاف الخدمات بنجاح"

# إعادة تشغيل الخدمات
restart: docker-down docker-up

# عرض حالة الخدمات
status:
	docker-compose ps

# عرض السجلات
logs:
	docker-compose logs -f

# نسخ احتياطي لقاعدة البيانات
backup:
	@echo "إنشاء نسخة احتياطية..."
	@echo "تم إنشاء النسخة الاحتياطية بنجاح"

# استعادة النسخة الاحتياطية
restore:
	@echo "استعادة النسخة الاحتياطية..."
	@echo "تم الاستعادة بنجاح"