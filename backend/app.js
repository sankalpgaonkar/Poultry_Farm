/**
 * Express application (no network listening here).
 * - backend/server.js listens on a port (local development and Render).
 * - api/index.js exports this app as a Vercel serverless function.
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const config = require('./config/env');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
app.disable('x-powered-by');
// Vercel and Render sit behind a proxy; needed for correct client IPs in rate limiting.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'connect-src': ["'self'", ...config.clientOrigins],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: same-origin requests (Vercel, Render single service) need nothing.
// A separately hosted frontend must be listed in CLIENT_ORIGIN.
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl, server-to-server, same-origin navigations
      if (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      if (config.clientOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);

// 2 MB is enough for one compressed store image (the browser compresses before upload).
// gzip responses (JSON and, in single-service mode, the website files).
app.use(compression());
app.use(express.json({ limit: '2mb' }));

if (!config.isProd && !config.isTest) {
  app.use('/api', (req, res, next) => {
    const t0 = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - t0}ms`));
    next();
  });
}

// ---------- Health checks (no database needed) ----------
app.get('/api/test', (req, res) => res.json({ message: 'Backend is reachable', timestamp: new Date().toISOString() }));
app.get('/api/health-check', async (req, res) => {
  // Try to connect so a cold serverless start reports the real database state.
  let dbError = false;
  try { await connectDB(); } catch { dbError = true; }
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : dbError ? 'cannot connect (check MONGODB_URI and Atlas network access)' : 'connecting',
    ai: config.geminiKey ? 'enabled' : 'offline mode',
  });
});

// ---------- Rate limits ----------
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a few minutes and try again.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: config.isTest ? 1000 : 20, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes and try again.' } });
app.use('/api', apiLimiter);
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

// ---------- Database (connect lazily, reuse the connection) ----------
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ success: false, message: 'The database is temporarily unavailable. Please try again in a moment.' });
  }
});

// ---------- Routes ----------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/farms', require('./routes/farmRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/marketplace', require('./routes/marketplaceRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/smart', require('./routes/smartRoutes'));
app.use('/api/supplies', require('./routes/supplyRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api', notFound);

// ---------- Optional: serve the built frontend (Render single service) ----------
const distDir = path.join(__dirname, '..', 'dist');
if (config.serveFrontend && fs.existsSync(distDir)) {
  app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(distDir, { maxAge: '1h', index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('PoultrySmart API is running.'));
}

app.use(errorHandler);

module.exports = app;
