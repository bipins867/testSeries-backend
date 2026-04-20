import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './common/config';
import { requestLogger } from './common/middleware/requestLogger';
import { errorHandler } from './common/middleware/errorHandler';
import { generalLimiter } from './common/middleware/rateLimiter';
import v1Routes from './routes/v1';

// Import models to register associations
import './database/models';

const app = express();

// ─── Security ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsing ──────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging & Rate Limiting ──────────────────────────────────
app.use(requestLogger);
app.use('/api/', generalLimiter);

// ─── Health Check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'UPSC Quiz Backend is running',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

// ─── API Routes ──────────────────────────────────
app.use('/api/v1', v1Routes);

// ─── 404 Handler ──────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

export default app;
