import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/routes';
import zoneRoutes from './modules/zone/routes';
import rateCardRoutes from './modules/rateCard/routes';
import codConfigRoutes from './modules/codConfig/routes';
import { adminAgentRouter, agentRouter } from './modules/agent/routes';
import orderRoutes from './modules/order/routes';
import addressRoutes from './modules/address/routes';

const app = express();

// ─── Security & Production Middlewares ────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for client API decoupling & Leaflet vector maps
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and standard configured origin
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'lastmile-delivery-backend',
    version: '1.0.0',
  });
});

// ─── API v1 Routes ───────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/admin/zones`, zoneRoutes);
app.use(`${API_PREFIX}/admin/rate-cards`, rateCardRoutes);
app.use(`${API_PREFIX}/admin/cod-config`, codConfigRoutes);
app.use(`${API_PREFIX}/admin/agents`, adminAgentRouter);
app.use(`${API_PREFIX}/agent`, agentRouter);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/addresses`, addressRoutes);

// ─── 404 Handler ─────────────────────────────────────────
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'The requested API endpoint does not exist.' });
});

// ─── Global Error Handler ────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const port = config.port;
const host = '0.0.0.0'; // Required for Railway / container environments
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    console.log(`🚀 LastMile Delivery API server running on ${host}:${port}`);
    console.log(`📍 Base URL: http://localhost:${port}${API_PREFIX}`);
    console.log(`🩺 Health check: http://localhost:${port}/health`);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
}

export default app;
