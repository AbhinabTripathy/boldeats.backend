const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Vendor authentication routes
router.post('/addVendor',vendorController.addVendor);
router.post('/login', vendorController.login);
router.get('/:vendorId/menu', vendorController.getMenuByMealType);
router.get('/list', vendorController.listVendors);




module.exports = router;