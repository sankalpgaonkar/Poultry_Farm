// Vercel serverless entry: every /api/* request is handled by the Express app.
const config = require('../backend/config/env');

if (config.problems.length) {
  console.error('[config] ' + config.problems.join('; '));
  module.exports = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Server is not configured yet. The site owner needs to set environment variables.' }));
  };
} else {
  module.exports = require('../backend/app');
}
