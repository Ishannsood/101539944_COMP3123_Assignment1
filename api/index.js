const app = require('../app');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
  return app(req, res);
};
