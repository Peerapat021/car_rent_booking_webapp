// src/lib/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@/lib/db/schema';  

const pool = mysql.createPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) ?? 3306,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? '10'),
    queueLimit: 0,
});

if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    throw new Error('กรุณาตั้งค่า DB_USER, DB_PASSWORD, DB_NAME ใน .env หรือ .env.local');
}

export const db = drizzle(pool, {
    schema,
    mode: 'default'
});

export { pool };