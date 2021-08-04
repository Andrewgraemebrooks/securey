const dotenv = require('dotenv');
const log = require('loglevel');

dotenv.config();
const { APP_ENV: appEnv, PRODUCTION_ORIGIN: prodOrigin } = process.env;

if (!appEnv) {
  log.error('Error, missing app environment, exiting program');
  process.exit(1);
}

const loggingLevel = appEnv === 'development' ? 'debug' : 'error';
log.setLevel(loggingLevel);

if (appEnv === 'production' && !prodOrigin) {
  log.error('Error, missing production origin, exiting program');
  process.exit(1);
}

let cors;
switch (appEnv) {
  case 'development':
    cors = {
      origin: true,
    };
    break;
  case 'production':
    cors = {
      origin: prodOrigin,
    };
    break;
  default:
    cors = {
      origin: false,
    };
    break;
}

const socketOptions = { cors };
module.exports = socketOptions;
