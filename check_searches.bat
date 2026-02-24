@echo off
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d junto_db -c "SELECT user_id, activity_slug, desired_date, time_start, time_end, lat, lng, radius_km, status FROM activity_searches ORDER BY created_at DESC LIMIT 10;"
