const { User, Vendor, Cart, Payment,Subscription } = require('../models');
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
      // Total users
      const totalUsers = await User.count({ where: { role: 'customer' } });
  
      // Total vendors
      const totalVendors = await Vendor.count();
  
      // Total orders (assuming each cart is a subscription purchase)
      const totalOrders = await Cart.count();
  
      // Total revenue (sum of approved payments only)
      const payments = await Payment.findAll({ where: { status: 'Completed' } });
      const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  
      return res.success(HttpStatus.OK, true, 'Dashboard stats fetched successfully', {
        totalUsers,
        totalVendors,
        totalOrders,
        totalRevenue
      });
  
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, 'Failed to fetch dashboard stats', error);
    }
  };
  
//get active users......................
  adminController.getActiveUsers = async (req, res) => {
    try {
        const subscriptions = await Subscription.findAll({
            include: [
    { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone_number'] },
    { model: Vendor, as: 'vendor', attributes: ['id', 'name'] }
]

        });

        const formatted = subscriptions.map(sub => ({
            userId: `USER${String(sub.userId).padStart(3, '0')}`,
            name: sub.user.name,
            vendorId: `VEND${String(sub.vendorId).padStart(3, '0')}`,
            subscriptionType: sub.endDate ? `${Math.round((new Date(sub.endDate) - new Date(sub.startDate)) / (1000 * 60 * 60 * 24))} days` : 'N/A',
            startDate: sub.startDate.toISOString().split('T')[0],
            pendingBalance: `₹${sub.amount}`,
            countdown: 0
        }));

        return res.success(HttpStatus.OK, true, 'Active users fetched successfully', formatted);
    } catch (error) {
        console.error('Active users error:', error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};


//get in active users................

adminController.getInactiveUsers = async (req, res) => {
    try {
        const subscribedUserIds = await Subscription.findAll({ attributes: ['userId'] });
        const subscribedIds = subscribedUserIds.map(sub => sub.userId);

      const inactiveUsers = await User.findAll({
    where: {
        id: {
            [require('sequelize').Op.notIn]: subscribedIds
        },
        role: 'customer'
    },
    attributes: ['id', 'name', 'email', 'phone_number', 'createdAt']
});


        const formatted = inactiveUsers.map(user => ({
            userId: `USER${String(user.id).padStart(3, '0')}`,
            name: user.name,
            phoneNumber: user.phone_number,
            email: user.email,
            joinDate: new Date(user.createdAt).toLocaleDateString('en-GB')
        }));

        return res.success(HttpStatus.OK, true, 'Inactive users fetched successfully', formatted);
    } catch (error) {
        console.error('Inactive users error:', error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};
  
// Get past subscribers
adminController.getPastSubscribers = async (req, res) => {
    try {
        const currentDate = new Date();
        
        const pastSubscriptions = await Subscription.findAll({
            where: {
                endDate: {
                    [require('sequelize').Op.lt]: currentDate
                }
            },
            include: [
                { 
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                { 
                    model: Vendor,
                    as: 'vendor',
                    attributes: ['id', 'name']
                }
            ],
            order: [['endDate', 'DESC']]
        });

        const formatted = pastSubscriptions.map(sub => ({
            userId: `USER${String(sub.userId).padStart(3, '0')}`,
            name: sub.user.name,
            vendorId: `VEND${String(sub.vendorId).padStart(3, '0')}`,
            startDate: sub.startDate.toISOString().split('T')[0],
            endDate: sub.endDate.toISOString().split('T')[0]
        }));

        return res.success(HttpStatus.OK, true, 'Past subscribers fetched successfully', formatted);
    } catch (error) {
        console.error('Past subscribers error:', error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};
module.exports = adminController;