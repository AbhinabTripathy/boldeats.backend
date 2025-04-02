const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth=require('../middlewares/auth.middleware');

router.post('/register', userController.register);
router.post('/verify-otp', userController.verifyOTP);
router.post('/login', userController.login);
router.get('/profile',auth.checkAuth,userController.getProfile);
router.put('/profile', auth.checkAuth, userController.updateProfile);

module.exports = router;