const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Runs after validator chains; turns failures into a consistent 400 response.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path || 'body', message: e.msg }));
  logger.warn('Validation failed', { method: req.method, path: req.originalUrl, fields: errors.map((e) => e.field) });
  next(new AppError('Validation failed', 400, errors));
};
