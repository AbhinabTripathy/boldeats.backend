const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All address routes require authentication
router.use(authMiddleware.checkAuth);

// Address routes
router.post('/', addressController.addAddress);
router.get('/', addressController.getAddresses);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;