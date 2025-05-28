import { Pool } from 'pg';

// For Render deployments (works for both development and production)
const isRender = process.env.IS_RENDER || process.env.RENDER; // Render automatically sets RENDER=true

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: parseInt(process.env.PG_PORT || '5432'),
  ssl: isRender ? { 
    rejectUnauthorized: false  // Required for Render's PostgreSQL
  } : false
});

// Test connection immediately
pool.connect()
  .then(client => {
    console.log('✅ Database connected to:', process.env.PG_HOST);
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed to:', process.env.PG_HOST);
    console.error('Full connection config:', {
      host: process.env.PG_HOST,
      user: process.env.PG_USER,
      database: process.env.PG_DATABASE,
      port: process.env.PG_PORT
    });
    process.exit(1);  // Fail fast if DB connection fails
  });

export default pool;