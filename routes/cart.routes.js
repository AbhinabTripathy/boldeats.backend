const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/add-to-cart', authMiddleware.checkAuth, cartController.addToCart);
router.get('/', authMiddleware.checkAuth,cartController.getCart);
router.delete('/:cartItemId', authMiddleware.checkAuth,cartController.removeFromCart);


module.exports = router;

