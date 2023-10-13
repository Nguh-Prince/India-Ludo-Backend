const dotenv = require('dotenv')
dotenv.config();

const CONFIG = {
    GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'],
    GOOGLE_SECRET_KEY: process.env['GOOGLE_SECRET_KEY'],
    GOOGLE_CALLBACK_URL: process.env['GOOGLE_CALLBACK_URL'],
    PORT: process.env['PORT'],
    NODE_ENV: process.env['NODE_ENV']
}

module.exports = {CONFIG};