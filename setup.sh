#!/bin/bash

# Estate Management System - Database Migration Setup Script
# This script helps set up the database migration from IndexedDB to PostgreSQL

echo "🏗️  Estate Management System - Database Migration Setup"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ Node.js and PostgreSQL are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your database credentials."
else
    echo "✅ .env file already exists"
fi

# Check if database exists
echo "🔍 Checking database connection..."
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  Please configure your database credentials in .env file"
    echo "   Edit .env and set:"
    echo "   - DB_NAME=estate_management"
    echo "   - DB_USER=estate_user"
    echo "   - DB_PASSWORD=your_secure_password"
    exit 1
fi

# Test database connection
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d postgres -c "SELECT 1;" &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to PostgreSQL. Please check your credentials."
    echo "   Make sure PostgreSQL is running and credentials are correct."
    exit 1
fi

echo "✅ Database connection successful"

# Create database if it doesn't exist
echo "🗄️  Creating database..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database might already exist"

# Run migration
echo "🚀 Running database migration..."
npm run migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

echo "✅ Migration completed successfully!"

# Start the application
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. The application is ready to run"
echo "2. Start the server with: npm start"
echo "3. Open your browser to: http://localhost:3000"
echo "4. Login with:"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo "⚠️  Important: Change the default password in production!"
echo ""
echo "🔧 For development with auto-restart: npm run dev"
echo "📚 Read README_DATABASE.md for more information"