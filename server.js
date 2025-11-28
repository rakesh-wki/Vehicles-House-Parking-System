const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');
const app = require('./src/app');

// Connect to DB, then start server
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the process using it or set a different PORT in your .env and restart.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

module.exports = server;