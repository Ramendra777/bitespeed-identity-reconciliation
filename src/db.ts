// src/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const config = {
  user: isTest ? process.env.TEST_PG_USER : process.env.PG_USER,
  host: isTest ? process.env.TEST_PG_HOST : process.env.PG_HOST,
  database: isTest ? process.env.TEST_PG_DATABASE : process.env.PG_DATABASE,
  password: isTest ? process.env.TEST_PG_PASSWORD : process.env.PG_PASSWORD,
  port: parseInt(isTest ? process.env.TEST_PG_PORT || '5432' : process.env.PG_PORT || '5432'),
};

export const pool = new Pool(config);