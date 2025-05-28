// src/db.ts
import { Pool } from 'pg';

// Use Render's DATABASE_URL if available (production), else local .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

export { pool };