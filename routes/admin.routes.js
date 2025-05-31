const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Admin authentication routes
router.post('/login', adminController.login);

// Admin dashboard route
router.get('/dashboard', authMiddleware.checkAuth, authMiddleware.isAdmin, adminController.getDashboard);


module.exports = router;