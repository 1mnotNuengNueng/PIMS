import cors from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { prisma } from './prisma';
import { apiRouter } from './routes';
import { seedReferenceData } from './services/seed.service';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

// Mount Main API Routes
app.use('/api', apiRouter);

// Global Centralized Error Handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', error);

  if (error.name === 'ValidationError') {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({
    message: 'เกิดข้อผิดพลาดในระบบ',
    detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
  });
});

// Database Connection with Retry Logic for Cloud Reliability
async function connectWithRetry(retries = 5, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully!');
      return;
    } catch (err: any) {
      console.warn(`Database connection attempt ${i} failed (${err.message}). Retrying in ${delay}ms...`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Server Startup
async function start() {
  await connectWithRetry();
  await seedReferenceData();

  app.listen(PORT, () => {
    console.log(`Backend is running on port ${PORT}`);
  });

  // Secondary listener if primary port differs from default 5001
  if (PORT !== 5001) {
    try {
      const altServer = app.listen(5001, () => {
        console.log(`Backend is also listening on secondary port 5001`);
      });
      altServer.on('error', () => {});
    } catch {}
  }
}

start().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});

export default app;
