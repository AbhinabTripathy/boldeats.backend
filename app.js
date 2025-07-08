const express = require("express");
require("dotenv").config();
const sequelize = require("./config/db");
const sendResponse = require("./middlewares/response.middleware");
const handleNotFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");
const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/address.routes");
const paymentRoutes = require("./routes/payment.routes");
const dailyOrderRoutes = require("./routes/dailyOrder.routes");
const { scheduleDailyOrders } = require("./schedulers/orderScheduler");

const seedAdmin = require("./seeders/adminSeeder");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.APP_PORT;
const baseUrl = process.env.BASE_URL;

// CORS configuration similar to your previous project
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Increase JSON and URL-encoded payload limits
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(sendResponse);

// Serve files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payment", paymentRoutes);

// Add new routes
app.use("/api/daily-orders", dailyOrderRoutes);

// Error handling middlewares
app.use(handleNotFound);
app.use(errorHandler);

async function startServer() {
  try {
    // First connect to database
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    try {
      // Temporarily disable foreign key checks
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

      // Change alter to false to prevent automatic schema changes
      await sequelize.sync({ force: false, alter: false });
      console.log("Database tables synced successfully.");

      // Re enable foreign key checks
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    } catch (syncError) {
      console.error("Database sync error:", syncError);
      console.log("Continuing server startup despite sync issues...");
    }

    // Seed admin user with error handling
    try {
      await seedAdmin();
      console.log("Admin seeding completed.");
    } catch (seedError) {
      console.error("Admin seeding error:", seedError);
    }

    // start server
    // Initialize the daily order scheduler
    scheduleDailyOrders();
    console.log("Daily order scheduler initialized");

    // Start server
    app.listen(port, () => {
      console.log(`Server running at : ${baseUrl}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

startServer();
