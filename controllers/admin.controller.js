const { User } = require('../models');  // Change from Admin to User
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const adminController = {};

// Admin login method
adminController.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Email and password are required",
                []
            );
        }
        
        // Find admin by email and role
        const admin = await User.findOne({ 
            where: { 
                email,
                role: 'ADMIN' 
            } 
        });
        
        if (!admin) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                "false",
                "Invalid credentials",
                []
            );
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                "false",
                "Invalid credentials",
                []
            );
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        // Remove password from response
        const adminResponse = admin.toJSON();
        delete adminResponse.password;
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Login successful",
            {
                admin: adminResponse,
                token
            }
        );
        
    } catch (error) {
        console.error("Admin login error:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Admin dashboard method
adminController.getDashboard = async (req, res) => {
    try {
        // You can customize this based on what data you want to show in the dashboard
        return res.success(
            HttpStatus.OK,
            "true",
            "Dashboard data fetched successfully",
            {
                // Add your dashboard data here
                stats: {
                    totalVendors: 0,
                    activeVendors: 0,
                    totalOrders: 0,
                    // Add more stats as needed
                }
            }
        );
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = adminController;