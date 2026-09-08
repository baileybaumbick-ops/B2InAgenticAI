// Vercel serverless entry point. Wrapped in an explicit function literal (rather than
// re-exporting the Express app object directly) so Vercel's Node runtime unambiguously
// detects a (req, res) request handler, regardless of how it statically analyzes the export.
const app = require('../src/app');

module.exports = (req, res) => app(req, res);
