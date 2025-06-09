const express = require('express');
const router = express.Router();
const dailyOrderController = require('../controllers/dailyOrder.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Vendor routes for daily orders
router.get('/vendor/daily-orders',authMiddleware.checkAuth,authMiddleware.checkRole('vendor'),dailyOrderController.getVendorDailyOrders);

router.patch('/vendor/daily-orders/:orderId',authMiddleware.checkAuth,authMiddleware.checkRole('vendor'), dailyOrderController.updateOrderStatus);

module.exports = router;