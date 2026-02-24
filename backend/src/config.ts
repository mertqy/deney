import dotenv from 'dotenv';
dotenv.config();

console.log('Checking environment variables...');
if (process.env.DATABASE_URL) {
    console.log('✓ DATABASE_URL found.');
} else {
    console.warn('! DATABASE_URL NOT FOUND. Using local defaults.');
}

export const config = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecret123',
    JWT_REFRESH_SECRET: (process.env.JWT_SECRET || 'supersecret123') + '_refresh',
    DB: process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for many hosted DBs like Render/Heroku
    } : {
        user: process.env.PG_USER || 'postgres',
        host: process.env.PG_HOST || 'localhost',
        database: process.env.PG_DATABASE || 'junto_db',
        password: process.env.PG_PASSWORD || 'postgres',
        port: parseInt(process.env.PG_PORT || '5432', 10),
    }

};
