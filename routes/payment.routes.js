const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/upload', authMiddleware.checkAuth, paymentController.uploadReceipt);
router.patch('/approve/:paymentId', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.approvePayment);
router.get('/wallet', authMiddleware.checkAuth, paymentController.getWallet);
router.get('/status', authMiddleware.checkAuth, paymentController.getUserPayments); 

// for vendors to view payments made to them
router.get('/vendor-payments', authMiddleware.checkAuth, paymentController.getVendorPayments);

//for admin to upload payment screenshots for vendors
router.post('/vendor-payment-receipt', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.uploadVendorPaymentReceipt);

module.exports = router;
