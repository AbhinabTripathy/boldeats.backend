const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/upload', authMiddleware.checkAuth, paymentController.uploadReceipt);
router.patch('/approve/:paymentId', authMiddleware.checkAuth, authMiddleware.isAdmin, paymentController.approvePayment);
router.get('/wallet', authMiddleware.checkAuth, paymentController.getWallet);

module.exports = router;
