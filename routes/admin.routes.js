const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const auth = require('../middlewares/auth.middleware');
const dailyOrderController = require('../controllers/dailyOrder.controller');



// Admin authentication routes
router.post('/login', adminController.login);

// Admin dashboard route
router.get('/dashboard', authMiddleware.checkAuth, authMiddleware.isAdmin, adminController.getDashboard);

// Payment management routes
router.get('/payments', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.getAllPayments);
router.patch('/payments/:paymentId/approve', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.approvePayment);
// User management routes
router.get('/users/active', auth.checkAuth, auth.isAdmin, adminController.getActiveUsers);
router.get('/users', auth.checkAuth, auth.isAdmin, adminController.getUsers);
router.get('/users/past-subscribers', auth.checkAuth, auth.isAdmin, adminController.getPastSubscribers);

// Subscription management routes
router.get('/subscriptions', authMiddleware.checkAuth, authMiddleware.isAdmin, adminController.getAllSubscriptions);
router.patch('/subscriptions/:subscriptionId', authMiddleware.checkAuth, authMiddleware.isAdmin, adminController.updateSubscriptionStatus);

// Daily order management routes
router.get('/all-daily-orders', authMiddleware.checkAuth, authMiddleware.isAdmin, adminController.getAllDailyOrders);


router.post(
  '/generate-daily-orders',
  authMiddleware.checkAuth,
  authMiddleware.isAdmin,
  async (req, res) => {
    try {
      await dailyOrderController.createDailyOrders();
      res.status(200).json({ success: true, message: 'Daily orders generated manually' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error generating daily orders', error: error.message });
    }
  }
);

  
module.exports = router;