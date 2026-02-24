@echo off
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d junto_db -c "SELECT id, name, email, password FROM users;"
