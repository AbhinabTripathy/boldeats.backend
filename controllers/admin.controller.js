const { User, Cart, CartItem } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const adminController = {};

// Admin login
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

        // Find admin user
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

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                "false",
                "Invalid credentials",
                []
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        return res.success(
            HttpStatus.OK,
            "true",
            "Admin login successful",
            { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } }
        );
    } catch (error) {
        console.error("Error in admin login:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get dashboard data
adminController.getDashboard = async (req, res) => {
    try {
        // Get counts for dashboard
        const userCount = await User.count({ where: { role: 'customer' } });
        
        // Get real order count and revenue data
        const { Order, Payment } = require('../models');
        
        // Count total orders
        const orderCount = await Order.count();
        
        // Calculate total revenue
        const totalRevenue = await Payment.sum('amount', {
            where: { status: 'completed' }
        }) || 0;
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Dashboard data fetched successfully",
            {
                stats: {
                    totalOrders: orderCount,
                    totalRevenue: totalRevenue,
                    totalUsers: userCount
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

// Get all orders
adminController.getOrders = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        // Mock data for now - you'll need to implement Order model
        const orders = [
            {
                id: "ORD001",
                customerName: "Rajesh Kumar",
                address: "42, Saheed Nagar, Bhubaneswar, Odisha",
                paymentMode: "UPI",
                price: 99,
                status: "Delivered"
            },
            {
                id: "ORD002",
                customerName: "Nikita Sharma",
                address: "15,Jaydev Vihar, Bhubaneswar, Odisha",
                paymentMode: "Card",
                price: 198,
                status: "Processing"
            }
        ];
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Orders fetched successfully",
            { orders }
        );
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get order details
adminController.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Mock data for now - you'll need to implement Order model
        const order = {
            id: id,
            customerName: "Rajesh Kumar",
            address: "15,Jaydev Vihar, Bhubaneswar, Odisha",
            paymentMode: "UPI",
            price: 99,
            status: "Delivered",
            items: [
                {
                    name: "Veg Thali",
                    quantity: 1,
                    price: 99
                }
            ],
            orderDate: "2023-03-25T10:30:00Z"
        };
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Order details fetched successfully",
            { order }
        );
    } catch (error) {
        console.error("Error fetching order details:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Update order status
adminController.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Mock data for now - you'll need to implement Order model
        const order = {
            id: id,
            customerName: "Rajesh Kumar",
            address: "15,Jaydev Vihar, Bhubaneswar, Odisha",
            paymentMode: "UPI",
            price: 99,
            status: status,
            items: [
                {
                    name: "Veg Thali",
                    quantity: 1,
                    price: 99
                }
            ],
            orderDate: "2023-03-25T10:30:00Z"
        };
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Order status updated successfully",
            { order }
        );
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get all payments
adminController.getPayments = async (req, res) => {
    try {
        // Mock data for now - you'll need to implement Payment model
        const payments = [
            {
                id: "PAY001",
                customerName: "John Doe",
                amount: 99,
                status: "Completed",
                date: "2023-03-25T10:30:00Z"
            },
            {
                id: "PAY002",
                customerName: "Jane Smith",
                amount: 198,
                status: "Pending",
                date: "2023-03-25T11:45:00Z"
            }
        ];
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Payments fetched successfully",
            { payments }
        );
    } catch (error) {
        console.error("Error fetching payments:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get all users
adminController.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: 'USER' },
            attributes: { exclude: ['password'] }
        });
        
        // Format users for the admin panel
        const formattedUsers = users.map((user, index) => ({
            id: user.id,
            userId: `BIND00${index + 1}`,
            name: user.name,
            phone: user.phone,
            email: user.email,
            // You'll need to implement address fetching
            address: "Address will be fetched from address model"
        }));
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Users fetched successfully",
            { users: formattedUsers }
        );
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get user details
adminController.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "User not found",
                []
            );
        }
        
        // You'll need to implement address and order fetching
        const userDetails = {
            ...user.toJSON(),
            addresses: [],
            orders: []
        };
        
        return res.success(
            HttpStatus.OK,
            "true",
            "User details fetched successfully",
            { user: userDetails }
        );
    } catch (error) {
        console.error("Error fetching user details:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = adminController;