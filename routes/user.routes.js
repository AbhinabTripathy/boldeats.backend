const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { checkAuth } = require('../middlewares/auth.middleware');

// ......................routes
router.post('/register', userController.register); 
router.post('/login', userController.login);
router.get('/profile', checkAuth, userController.getProfile);
router.put('/profile', checkAuth, userController.updateProfile);

module.exports = router;