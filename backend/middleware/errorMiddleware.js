const config = require('../config/env');

/** Wraps an async route handler so thrown errors reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Creates an error with an HTTP status, e.g. throw httpError(404, 'Listing not found'). */
const httpError = (status, message) => Object.assign(new Error(message), { status });

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Central error handler. Clients get a short, safe message; full details go to the server log.
 */
// Express needs all four arguments to treat this as an error handler.
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.expose === false ? 'Something went wrong' : err.message;
  let details;

  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'That upload is too large. Please use a smaller image (under 2 MB).';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path || 'id'}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `An account with this ${field} already exists.`;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo is too large (maximum 5 MB).' : err.message;
  } else if (err.name === 'ZodError') {
    status = 400;
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    message = details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join('; ');
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    // Never leak internals (database errors, stack traces) to the browser.
    message = 'Something went wrong on our side. Please try again.';
  }

  const body = { success: false, message };
  if (details) body.errors = details;
  if (!config.isProd && status >= 500 && err.stack) body.stack = err.stack;
  res.status(status).json(body);
};

module.exports = { errorHandler, notFound, asyncHandler, httpError };
