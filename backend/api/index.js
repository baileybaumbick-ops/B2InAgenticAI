// Vercel serverless entry point. Vercel's bundler sometimes wraps a CommonJS module's
// export under a `default` key during ESM interop, so handle both shapes defensively
// rather than assuming `require(...)` returns the Express app directly.
const mod = require('../src/app');
const app = typeof mod === 'function' ? mod : mod.default;

module.exports = (req, res) => app(req, res);
