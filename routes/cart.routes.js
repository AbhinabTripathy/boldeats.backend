const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All cart routes require authentication
router.use(authMiddleware.checkAuth);

// Cart routes
router.post('/add', cartController.addToCart);
router.get('/', cartController.getCart);
router.put('/update', cartController.updateCartItem);
router.delete('/item/:cartItemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;