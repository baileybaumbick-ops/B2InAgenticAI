// Vercel serverless entry point. Express apps are callable as (req, res) handlers,
// so exporting the app directly (no app.listen here) is all @vercel/node needs.
module.exports = require('../src/app');
