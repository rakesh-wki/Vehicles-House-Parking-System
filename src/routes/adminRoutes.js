const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const adminCtrl = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

// Dashboard
router.get('/dashboard', adminCtrl.getDashboard);

// User Management
router.get('/users', adminCtrl.getAllUsers);
router.get('/users/:id', adminCtrl.getUser);
router.put('/users/:id', adminCtrl.updateUser);
router.delete('/users/:id', adminCtrl.deleteUser);

// Parking Management
router.get('/parking', adminCtrl.getAllParkingSpots);
router.delete('/parking/:id', adminCtrl.deleteParkingSpot);

// Booking Management
router.get('/bookings', adminCtrl.getAllBookings);

// Transaction Management
router.get('/transactions', adminCtrl.getAllTransactions);

// Reports
router.get('/reports/revenue', adminCtrl.getRevenueReport);

module.exports = router;

