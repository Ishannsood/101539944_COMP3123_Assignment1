const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// POST /api/v1/user/signup
exports.signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? 'username' : 'email';
    logger.warn('Signup failed: duplicate user', { field });
    throw new AppError(`A user with this ${field} already exists`, 409);
  }

  const user = await User.create({ username, email, password }); // password hashed in pre-save hook
  logger.info('User registered', { userId: user.id, username: user.username });

  res.status(201).json({ status: 'success', message: 'User registered successfully', data: { user } });
});

// POST /api/v1/user/login  (username + password OR email + password)
exports.login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = email || username;

  const user = await User.findOne(email ? { email } : { username }).select('+password');
  const valid = user && (await user.comparePassword(password));

  if (!valid) {
    // Same message for unknown user and wrong password: prevents user enumeration.
    logger.warn('Login failed: invalid credentials', { identifier, ip: req.ip });
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });

  logger.info('Login successful', { userId: user.id, username: user.username });
  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    token,
    data: { user },
  });
});
