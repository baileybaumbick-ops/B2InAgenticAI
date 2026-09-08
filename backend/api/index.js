// Vercel serverless entry point — fully self-contained (no requires reaching outside this
// file except node_modules packages), which a minimal zero-dependency probe confirmed
// runs correctly on this project. Local dev still uses backend/src/app.js + server.js
// (see package.json "dev"); this file is Vercel-only and intentionally duplicates that
// same request-handling logic.
require('dotenv').config();
const express = require('express');
const { NeonPostgrestClient, fetchWithToken } = require('@neondatabase/postgrest-js');

const NEON_DATA_API_URL = process.env.NEON_DATA_API_URL;
if (!NEON_DATA_API_URL) {
  throw new Error('Missing required env var NEON_DATA_API_URL.');
}

// Factory, not a singleton — see backend/src/lib/dataApiClient.js for why: a shared
// client with mutable token state would risk one user's request running with another
// user's token under Node's concurrent event loop.
function contactsClientFor(token) {
  return new NeonPostgrestClient({
    dataApiUrl: NEON_DATA_API_URL,
    options: { global: { fetch: fetchWithToken(async () => token) } },
  });
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token || token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Missing or malformed Authorization bearer token.' });
  }
  req.token = token;
  next();
}

const ALLOWED_PRIORITIES = ['high', 'medium', 'low'];
const TEXT_FIELDS = ['company', 'role', 'where_met', 'notes'];

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
        return res.status(400).json({ error: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}.` });
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

const SORTABLE_COLUMNS = ['name', 'company', 'priority', 'created_at', 'updated_at'];
const WRITABLE_FIELDS = ['name', 'company', 'role', 'where_met', 'notes', 'priority'];

function pickWritable(body) {
  const out = {};
  for (const field of WRITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) out[field] = body[field];
  }
  return out;
}

function dataApiErrorStatus(error) {
  if (!error) return 500;
  if (error.code === 'PGRST116') return 404;
  return 400;
}

const contactsRouter = express.Router();
contactsRouter.use(requireAuth);

contactsRouter.get('/', async (req, res) => {
  const { sortBy = 'created_at', sortDir = 'desc', priority, company, search } = req.query;

  if (!SORTABLE_COLUMNS.includes(sortBy)) {
    return res.status(400).json({ error: `sortBy must be one of: ${SORTABLE_COLUMNS.join(', ')}.` });
  }
  if (!['asc', 'desc'].includes(sortDir)) {
    return res.status(400).json({ error: 'sortDir must be "asc" or "desc".' });
  }

  const client = contactsClientFor(req.token);
  let query = client.from('contacts').select('*').order(sortBy, { ascending: sortDir === 'asc' });
  if (priority) query = query.eq('priority', priority);
  if (company) query = query.ilike('company', `%${company}%`);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  res.json(data);
});

contactsRouter.post('/', validateContact({ requireName: true }), async (req, res) => {
  const client = contactsClientFor(req.token);
  const { data, error } = await client.from('contacts').insert(pickWritable(req.body)).select().single();
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  res.status(201).json(data);
});

contactsRouter.put('/:id', validateContact({ requireName: false }), async (req, res) => {
  const client = contactsClientFor(req.token);
  const { data, error } = await client
    .from('contacts')
    .update(pickWritable(req.body))
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Contact not found.' });
  res.json(data[0]);
});

contactsRouter.delete('/:id', async (req, res) => {
  const client = contactsClientFor(req.token);
  const { data, error } = await client.from('contacts').delete().eq('id', req.params.id).select();
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Contact not found.' });
  res.status(204).end();
});

const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/contacts', contactsRouter);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = (req, res) => app(req, res);
