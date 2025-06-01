const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const auth = require('../middlewares/auth.middleware');


// Admin authentication routes
router.post('/login', adminController.login);

// Admin dashboard route
router.get('/dashboard', authMiddleware.checkAuth, authMiddleware.isAdmin, adminController.getDashboard);

// Payment management routes
router.get('/payments', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.getAllPayments);
router.patch('/payments/:paymentId/approve', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.approvePayment);
router.get('/users/active', auth.checkAuth, auth.isAdmin, adminController.getActiveUsers);
router.get('/users/inactive', auth.checkAuth, auth.isAdmin, adminController.getInactiveUsers);
router.get('/users/past-subscribers', auth.checkAuth, auth.isAdmin, adminController.getPastSubscribers);

module.exports = router;