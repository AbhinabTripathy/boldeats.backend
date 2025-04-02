const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Admin authentication
router.post('/login', adminController.login);

// Protected admin routes
router.use(authMiddleware.checkAuth);
router.use(authMiddleware.isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Payments
router.get('/payments', adminController.getPayments);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);

module.exports = router;