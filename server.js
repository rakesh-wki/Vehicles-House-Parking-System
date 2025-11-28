const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const otpRoutes = require('./src/routes/otpRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/otp', otpRoutes);
app.use('/parking', parkingRoutes);
app.use('/booking', bookingRoutes);
app.use('/payment', paymentRoutes);

// error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ message, error: process.env.NODE_ENV === 'development' ? err : {} });
});

const PORT = process.env.PORT || 5000;

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

module.exports = app;