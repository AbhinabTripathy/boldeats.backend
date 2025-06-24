const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Vendor authentication routes
router.post('/addVendor', vendorController.addVendor);
router.post('/login', vendorController.login);
router.get('/:vendorId/menu', vendorController.getMenuByMealType);
router.get('/list', vendorController.listVendors);
router.put('/:id', vendorController.updateVendor);
router.put('/toggle-status/:id', vendorController.toggleVendorStatus);
router.delete('/delete/:id',authMiddleware.checkAuth,authMiddleware.isAdmin,vendorController.deleteVendor);
router.get('/dashboard/:vendorId', vendorController.getVendorDashboard);
router.get('/active-users/:vendorId', vendorController.getActiveUsersByVendor);
router.get('/past-subscribers/:vendorId', vendorController.getPastSubscribers);
router.get('/:vendorId', vendorController.getVendorById);

module.exports = router;