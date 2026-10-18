const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

const build = (name, { max, windowMs }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', { limiter: name, method: req.method, path: req.originalUrl, ip: req.ip });
      res.status(429).json({
        status: 'fail',
        message: 'Too many requests. Please try again later.',
      });
    },
  });

// Strict limits for credential endpoints (brute-force / credential-stuffing protection).
exports.loginLimiter = build('login', config.authRateLimit);
exports.signupLimiter = build('signup', config.authRateLimit);
// General limit for all /api traffic.
exports.apiLimiter = build('api', config.apiRateLimit);
