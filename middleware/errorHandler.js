const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const config = require('../config');

exports.notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Centralized error handler: every error leaves the API as consistent JSON.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;
  let operational = Boolean(err.isOperational);

  if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Malformed JSON in request body'; operational = true;
  } else if (err.type === 'entity.too.large') {
    status = 413; message = 'Request body too large'; operational = true;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400; message = 'Validation failed'; operational = true;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400; message = `Invalid value for ${err.path}`; operational = true;
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).find((k) => k !== 'user') || 'field';
    status = 409; message = `A record with this ${field} already exists`; operational = true;
  }

  if (!operational) {
    status = 500;
    message = 'Internal server error';
    errors = undefined;
  }

  if (status >= 500) {
    logger.error('Unhandled error', { method: req.method, path: req.originalUrl, error: err.message, stack: err.stack });
  } else {
    logger.warn('Request error', { method: req.method, path: req.originalUrl, status, message });
  }

  const body = { status: status >= 500 ? 'error' : 'fail', message };
  if (errors) body.errors = errors;
  if (config.env === 'development' && status >= 500) body.debug = err.message;
  res.status(status).json(body);
};
