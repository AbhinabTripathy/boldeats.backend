const express = require('express');
require("dotenv").config();
const sequelize = require('./config/db');
const sendResponse = require('./middlewares/response.middleware');
const handleNotFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const userRoutes = require('./routes/user.routes');
const mealRoutes=require('./routes/meal.routes');
const cartRoutes=require('./routes/cart.routes');
const addressRoutes = require('./routes/address.routes');
const adminRoutes = require('./routes/admin.routes');
const cors = require('cors');

const app = express();
const port = process.env.APP_PORT;
const baseUrl = process.env.BASE_URL;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sendResponse);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/meals',mealRoutes);
app.use('/api/cart',cartRoutes);
app.use('/api/addresses',addressRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middlewares
app.use(handleNotFound);
app.use(errorHandler);

async function startServer() {
    try {
        // First connect to database
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // sync models
        await sequelize.sync({ force:false });
        console.log('Database tables synced successfully.');

        // Finally start the server
        app.listen(port, () => {
            console.log(`Server running at : ${baseUrl}`);
        });
    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
}

startServer();