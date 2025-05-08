const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Admin routes (protected)
router.post('/add', authMiddleware.checkAuth, authMiddleware.isAdmin, vendorController.addVendor);
router.get('/list', authMiddleware.checkAuth, authMiddleware.isAdmin, vendorController.getVendorsList);

// Public routes for user panel
router.get('/active', vendorController.getActiveVendors);

module.exports = router;