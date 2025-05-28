import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: 'bitespeed', // Hardcoded database name (or use process.env.PG_DATABASE if properly set)
  port: parseInt(process.env.PG_PORT || '5432'),
  ssl: { 
    rejectUnauthorized: false  // Always required for Render's PostgreSQL
  }
});

// Enhanced connection test
pool.connect()
  .then(client => {
    console.log('✅ Database connected to:', {
      host: process.env.PG_HOST,
      database: 'bitespeed'
    });
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', {
      error: err.message,
      config: {
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        database: 'bitespeed',
        port: process.env.PG_PORT
      }
    });
    process.exit(1);
  });

export default pool;