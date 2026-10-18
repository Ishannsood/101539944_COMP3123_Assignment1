const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');

const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

app.set('trust proxy', 1); // correct client IPs behind Vercel's proxy (needed for rate limiting)
app.use(helmet()); // security headers
app.use(requestLogger);
app.use(express.json({ limit: '10kb' }));

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

app.get('/health', (req, res) => {
  const dbState = DB_STATES[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbState,
  });
});

app.get('/', (req, res) => {
  res.json({ name: 'COMP3123 Assignment 1 API', health: '/health', endpoints: ['/api/v1/user', '/api/v1/emp'] });
});

app.use('/api', apiLimiter);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
