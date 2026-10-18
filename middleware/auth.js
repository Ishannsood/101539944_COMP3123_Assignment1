const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Verifies "Authorization: Bearer <jwt>" and attaches the authenticated user to req.user.
module.exports = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  const ctx = { method: req.method, path: req.originalUrl, ip: req.ip };

  if (scheme !== 'Bearer' || !token) {
    logger.warn('Authentication failed: missing or malformed Authorization header', ctx);
    throw new AppError('Authentication required. Send header: Authorization: Bearer <token>', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: token expired', ctx);
      throw new AppError('Token has expired. Please log in again.', 401);
    }
    logger.warn('Authentication failed: invalid token', ctx);
    throw new AppError('Invalid token', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    logger.warn('Authentication failed: token user no longer exists', ctx);
    throw new AppError('Invalid token', 401);
  }

  req.user = user;
  next();
});
