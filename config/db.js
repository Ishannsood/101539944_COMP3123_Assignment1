const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

let connectionPromise = null;

// Connection is cached so it is reused across requests (important on Vercel serverless).
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongoUri, { dbName: config.dbName, serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        logger.info('MongoDB connected', { database: config.dbName });
        return m.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        logger.error('MongoDB connection failed', { error: err.message });
        throw err;
      });
  }
  return connectionPromise;
};

module.exports = connectDB;
