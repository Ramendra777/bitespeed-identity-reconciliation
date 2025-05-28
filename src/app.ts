// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import { identify } from './controllers/identityController';
import { pool } from './db';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Main identify endpoint
app.post('/identify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await identify(req, res);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

export default app;