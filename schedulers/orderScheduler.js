const cron = require('node-cron');
const dailyOrderController = require('../controllers/dailyOrder.controller');

// Schedule task to run at midnight (00:00) every day
const scheduleDailyOrders = () => {
    console.log('Setting up daily order creation scheduler...');
    
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily order creation task...');
        try {
            await dailyOrderController.createDailyOrders();
            console.log('Daily orders created successfully');
        } catch (error) {
            console.error('Error in daily order creation:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Adjust timezone as needed
    });
};

module.exports = { scheduleDailyOrders };