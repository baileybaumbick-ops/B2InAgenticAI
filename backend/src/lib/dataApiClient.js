const { NeonPostgrestClient, fetchWithToken } = require('@neondatabase/postgrest-js');
const { NEON_DATA_API_URL } = require('../env');

// Returns a fresh Data API client bound to one caller's own JWT.
//
// IMPORTANT: this must stay a factory, never a shared/module-level singleton with a
// mutable "current token" variable. Node's event loop interleaves concurrent requests
// from different signed-in users; a shared client would let one user's request run with
// another user's token. Each call here creates a small object (no I/O), so the per-request
// cost is negligible — there is no real perf tradeoff for the isolation it buys.
function contactsClientFor(token) {
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
