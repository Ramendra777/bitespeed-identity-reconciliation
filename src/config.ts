// src/config.ts
interface PostgresConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export const POSTGRES_CONFIG: PostgresConfig = {
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'bitespeed',
  password: process.env.PG_PASSWORD || 'postgres',
  port: parseInt(process.env.PG_PORT || '5432'),
};

export const PORT = parseInt(process.env.PORT || '3000');