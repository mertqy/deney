@echo off
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d junto_db -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;"
