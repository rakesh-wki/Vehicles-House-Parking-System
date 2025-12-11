const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { NODE_ENV } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(bodyParser.json());

// CORS (for frontend)
const cors = require('cors');
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/otp', otpRoutes);
app.use('/parking', parkingRoutes);
app.use('/booking', bookingRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin', adminRoutes);

// Error handler (should be last)
app.use(errorHandler);

module.exports = app;
