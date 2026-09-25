import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
import { migrate } from '../src/server/database.mjs';
nextEnv.loadEnvConfig(process.cwd());
for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) if (!process.env[key]) throw Error(`Set ${key} before migrating.`);
const pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}) } } : {}) });
try { await migrate(pool); console.log('DROGS MySQL registration tables are ready.'); }
finally { await pool.end(); }
