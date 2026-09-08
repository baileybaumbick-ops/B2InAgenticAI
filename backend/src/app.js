const express = require('express');
const contactsRouter = require('./routes/contacts');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/contacts', contactsRouter);

// Centralized fallback so an unexpected error never leaks a stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
