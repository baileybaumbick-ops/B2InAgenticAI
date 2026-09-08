// Sanity-checks that a bearer token is present and JWT-shaped, and attaches it to
// req.token for the route handler to forward to the Neon Data API.
//
// This middleware does NOT verify the token's signature or claims: the Neon Data API
// does that (via JWKS) on every forwarded request, and Postgres Row-Level Security is
// the actual authorization boundary. Rejecting here is purely a fast, cheap short-circuit
// for obviously-missing/malformed auth, not a security control on its own.
function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token || token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Missing or malformed Authorization bearer token.' });
  }

  req.token = token;
  next();
}

module.exports = { requireAuth };
