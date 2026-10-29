/**
 * Central configuration. Every environment variable the backend reads is listed here.
 * In production the server refuses to start without the required secrets, instead of
 * silently falling back to an insecure default.
 */
require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Accept the old variable names too, so existing deployments keep working.
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_MONGODB_URI || '';

let jwtSecret = process.env.JWT_SECRET || '';
const problems = [];

if (!mongoUri && isProd) problems.push('MONGODB_URI is not set');
if (isProd && jwtSecret.length < 32) problems.push('JWT_SECRET must be set to a random string of at least 32 characters');
if (!jwtSecret && !isProd) {
  // Development only: a per-process random secret. Logins reset when the server restarts.
  jwtSecret = require('crypto').randomBytes(48).toString('hex');
  if (!isTest) console.warn('[config] JWT_SECRET not set; using a temporary development secret.');
}

const clientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
const geminiEnabled = Boolean(geminiKey) && !/^\[.*\]$/.test(geminiKey) && geminiKey !== 'dummy_key_for_now';

const config = {
  nodeEnv,
  isProd,
  isTest,
  port: Number(process.env.PORT) || 5005,
  mongoUri: mongoUri || 'mongodb://127.0.0.1:27017/poultrysmart',
  hasMongoUri: Boolean(mongoUri),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins,
  geminiKey: geminiEnabled ? geminiKey : '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  serveFrontend: process.env.SERVE_FRONTEND === 'true',
  isVercel: Boolean(process.env.VERCEL),
  problems,
};

module.exports = config;
