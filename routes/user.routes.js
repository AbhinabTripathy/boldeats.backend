const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { checkAuth } = require('../middlewares/auth.middleware');

// Authentication routes
router.post('/register', userController.register); 
router.post('/login', userController.login);
router.get('/profile', checkAuth, userController.getProfile);
router.put('/profile', checkAuth, userController.updateProfile);

// Public routes for users to access kitchen information
router.get('/vendors', userController.getAllVendors);  
router.get('/vendors/:id', userController.getVendorDetails);  
router.get('/subscription', checkAuth, userController.getUserSubscription);


module.exports = router;