require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. See .env.example');
}

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comp3123_assignment1',
  dbName: 'comp3123_assignment1',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  authRateLimit: {
    max: num(process.env.AUTH_RATE_LIMIT_MAX, 10),
    windowMs: num(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 15) * 60 * 1000,
  },
  apiRateLimit: {
    max: num(process.env.API_RATE_LIMIT_MAX, 100),
    windowMs: num(process.env.API_RATE_LIMIT_WINDOW_MIN, 15) * 60 * 1000,
  },
};
