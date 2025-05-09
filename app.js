const express = require('express');
require("dotenv").config();
const sequelize = require('./config/db');
const sendResponse = require('./middlewares/response.middleware');
const handleNotFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const vendorRoutes = require('./routes/vendor.routes');
const seedAdmin = require('./seeders/adminSeeder');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.APP_PORT;
const baseUrl = process.env.BASE_URL;

// CORS configuration similar to your previous project
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase JSON and URL-encoded payload limits
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(sendResponse);

// Serve files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes);

// Error handling middlewares
app.use(handleNotFound);
app.use(errorHandler);

async function startServer() {
    try {
        // First connect to database
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // sync models with error handling like in your previous project
        try {
            // Temporarily disable foreign key checks
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            
            await sequelize.sync({ force: false, alter: false });
            console.log('Database tables synced successfully.');
            
            // Re-enable foreign key checks
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            
        } catch (syncError) {
            console.error("Database sync error:", syncError);
            console.log("Continuing server startup despite sync issues...");
        }
        
        // Seed admin user with error handling
        try {
            await seedAdmin();
            console.log('Admin seeding completed.');
        } catch (seedError) {
            console.error("Admin seeding error:", seedError);
        }

        // start server
        app.listen(port, () => {
            console.log(`Server running at : ${baseUrl}`);
        });
    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
}

startServer();