const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

(async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      logger.info('Server started', { port: config.port, env: config.env });
    });
  } catch (err) {
    logger.error('Server failed to start', { error: err.message });
    process.exit(1);
  }
})();
