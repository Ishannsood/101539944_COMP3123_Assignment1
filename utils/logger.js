const path = require('path');
const fs = require('fs');
const winston = require('winston');

const { combine, timestamp, json, printf, colorize } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp(),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${message}${extra}`;
  })
);

const transports = [new winston.transports.Console({ format: consoleFormat })];

// Vercel's filesystem is read-only, so file logging is local-only.
if (!process.env.VERCEL) {
  const logDir = path.join(__dirname, '..', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const fileFormat = combine(timestamp(), json());
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'app.log'), format: fileFormat }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', format: fileFormat })
  );
}

module.exports = winston.createLogger({ level: 'info', transports });
