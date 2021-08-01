const dotenv = require('dotenv');

dotenv.config();
const { APP_ENV: appEnv } = process.env;

let cors;
switch (appEnv) {
  case 'development':
    cors = {
      origin: true,
    };
    break;
  case 'production':
    cors = {};
    break;
  default:
    cors = {};
    break;
}

const socketOptions = { cors };
module.exports = socketOptions;
