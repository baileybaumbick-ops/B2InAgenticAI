const app = require('./app');
const { PORT } = require('./env');

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
