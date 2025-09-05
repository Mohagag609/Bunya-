-- Initialize database with default data
-- This file runs when the PostgreSQL container starts for the first time

-- Create default safe
INSERT INTO safes (id, name, balance) 
VALUES ('S-default', 'الخزنة الرئيسية', 0)
ON CONFLICT (id) DO NOTHING;

-- Create default settings
INSERT INTO settings (key, value) 
VALUES ('appSettings', '{"theme":"dark","font":16,"pass":null}')
ON CONFLICT (key) DO NOTHING;

-- Create migration status
INSERT INTO keyval (key, value) 
VALUES ('migrationComplete', 'true')
ON CONFLICT (key) DO NOTHING;