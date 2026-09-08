const { NEON_DATA_API_URL } = require('../env');

// @neondatabase/postgrest-js ships ESM-only. A plain require() works on newer local
// Node versions (which added transparent require(esm) support) but fails hard on
// Vercel's runtime with ERR_REQUIRE_ESM. Dynamic import() works everywhere, so we cache
// the module promise and await it before building each client.
let postgrestModulePromise;
function loadPostgrestModule() {
  if (!postgrestModulePromise) {
    postgrestModulePromise = import('@neondatabase/postgrest-js');
  }
  return postgrestModulePromise;
}

// Returns a fresh Data API client bound to one caller's own JWT.
//
// IMPORTANT: this must stay a factory, never a shared/module-level singleton with a
// mutable "current token" variable. Node's event loop interleaves concurrent requests
// from different signed-in users; a shared client would let one user's request run with
// another user's token. Each call here creates a small object (no I/O), so the per-request
// cost is negligible — there is no real perf tradeoff for the isolation it buys.
async function contactsClientFor(token) {
  const { NeonPostgrestClient, fetchWithToken } = await loadPostgrestModule();
  return new NeonPostgrestClient({
    dataApiUrl: NEON_DATA_API_URL,
    options: {
      global: {
        fetch: fetchWithToken(async () => token),
      },
    },
  });
}

module.exports = { contactsClientFor };
