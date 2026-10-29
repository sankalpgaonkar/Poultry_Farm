/**
 * Starts the API on a port. Used for local development (npm run dev) and on Render (npm start).
 */
const config = require('./config/env');

if (config.problems.length) {
  console.error('[config] Cannot start:\n - ' + config.problems.join('\n - '));
  process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

const server = app.listen(config.port, () => {
  console.log(`PoultrySmart API listening on port ${config.port} (${config.nodeEnv})`);
  if (!config.geminiKey) console.log('[ai] GEMINI_API_KEY not set: AI features run in offline mode.');
  connectDB().catch(() => console.error('[db] initial connection failed; will retry on the next request.'));
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
