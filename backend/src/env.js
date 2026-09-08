require('dotenv').config();

const NEON_DATA_API_URL = process.env.NEON_DATA_API_URL;

if (!NEON_DATA_API_URL) {
  throw new Error('Missing required env var NEON_DATA_API_URL. See backend/.env.example.');
}

module.exports = {
  NEON_DATA_API_URL,
  PORT: process.env.PORT || 4000,
};
