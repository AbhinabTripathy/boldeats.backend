const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');

// Public routes - no authentication required
router.get('/thali-options', mealController.getThaliOptions);
router.get('/thali/:id', mealController.getThaliById);
router.get('/weekly-menu', mealController.getWeeklyMenu);
router.get('/available-types', mealController.getAvailableThaliTypes);

module.exports = router;