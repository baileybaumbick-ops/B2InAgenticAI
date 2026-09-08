const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { validateContact } = require('../middleware/validateContact');
const { contactsClientFor } = require('../lib/dataApiClient');

const router = express.Router();
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
  // PostgREST/Data API surfaces RLS/permission denials and not-found rows the same way
  // (zero rows), which is the correct, non-leaky behavior for a security boundary.
  if (!error) return 500;
  if (error.code === 'PGRST116') return 404; // .single() found no row
  return 400;
}

router.use(requireAuth);

// GET /api/contacts?sortBy=name&sortDir=asc&priority=high&company=acme&search=jan
router.get('/', async (req, res) => {
  const { sortBy = 'created_at', sortDir = 'desc', priority, company, search } = req.query;

  if (!SORTABLE_COLUMNS.includes(sortBy)) {
    return res.status(400).json({ error: `sortBy must be one of: ${SORTABLE_COLUMNS.join(', ')}.` });
  }
  if (!['asc', 'desc'].includes(sortDir)) {
    return res.status(400).json({ error: 'sortDir must be "asc" or "desc".' });
  }

  const client = await contactsClientFor(req.token);
  let query = client.from('contacts').select('*').order(sortBy, { ascending: sortDir === 'asc' });

  if (priority) query = query.eq('priority', priority);
  if (company) query = query.ilike('company', `%${company}%`);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  res.json(data);
});

router.post('/', validateContact({ requireName: true }), async (req, res) => {
  const client = await contactsClientFor(req.token);
  const { data, error } = await client.from('contacts').insert(pickWritable(req.body)).select().single();
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', validateContact({ requireName: false }), async (req, res) => {
  const client = await contactsClientFor(req.token);
  const { data, error } = await client
    .from('contacts')
    .update(pickWritable(req.body))
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  // RLS silently filters rows the caller doesn't own, so an update targeting someone
  // else's contact (or a nonexistent id) matches zero rows rather than erroring — surface
  // that as a 404 instead of a misleading 200, so the frontend/isolation test can tell.
  if (!data || data.length === 0) return res.status(404).json({ error: 'Contact not found.' });
  res.json(data[0]);
});

router.delete('/:id', async (req, res) => {
  const client = await contactsClientFor(req.token);
  const { data, error } = await client.from('contacts').delete().eq('id', req.params.id).select();
  if (error) return res.status(dataApiErrorStatus(error)).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Contact not found.' });
  res.status(204).end();
});

module.exports = router;
