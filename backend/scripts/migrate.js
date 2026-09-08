// One-time admin script: applies db/001_contacts_schema.sql using DATABASE_URL.
// Not imported by the running server — this is the ONLY place DATABASE_URL is used.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Missing DATABASE_URL. Set it in backend/.env (see backend/.env.example).');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, '..', '..', 'db', '001_contacts_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Migration applied: db/001_contacts_schema.sql');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
