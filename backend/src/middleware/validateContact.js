const ALLOWED_PRIORITIES = ['high', 'medium', 'low'];
const TEXT_FIELDS = ['company', 'role', 'where_met', 'notes'];

// Validates the body for POST /api/contacts and PUT /api/contacts/:id.
// - `requireName`: name is mandatory on create, optional (but still validated if present) on edit.
// Always strips any client-supplied `user_id` — ownership is never client-controlled;
// it comes from the caller's own JWT (auth.user_id()) enforced by RLS.
function validateContact({ requireName }) {
  return (req, res, next) => {
    const body = req.body || {};
    delete body.user_id;

    const hasName = Object.prototype.hasOwnProperty.call(body, 'name');

    if (requireName || hasName) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required and cannot be empty.' });
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'priority')) {
      if (!ALLOWED_PRIORITIES.includes(body.priority)) {
        return res.status(400).json({
          error: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`,
        });
      }
    }

    for (const field of TEXT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== null) {
        if (typeof body[field] !== 'string') {
          return res.status(400).json({ error: `${field} must be a string.` });
        }
      }
    }

    req.body = body;
    next();
  };
}

module.exports = { validateContact, ALLOWED_PRIORITIES };
