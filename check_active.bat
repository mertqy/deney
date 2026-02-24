@echo off
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d junto_db -c "SELECT u.name, s.activity_slug, s.status, s.lat, s.lng, s.radius_km FROM activity_searches s JOIN users u ON s.user_id = u.id WHERE s.status = 'searching';"
