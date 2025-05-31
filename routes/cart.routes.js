const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/add-to-cart', authMiddleware.checkAuth, cartController.addToCart);

module.exports = router;

