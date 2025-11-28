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

const app = express();

// Middlewares
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/otp', otpRoutes);
app.use('/parking', parkingRoutes);
app.use('/booking', bookingRoutes);
app.use('/payment', paymentRoutes);

// Error handler (should be last)
app.use(errorHandler);

module.exports = app;
