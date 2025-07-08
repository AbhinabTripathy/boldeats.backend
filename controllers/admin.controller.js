const { User, Vendor, Cart, Payment,Subscription,Address,DailyOrder } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const { Op } = require('sequelize');

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
          { model: User, as: 'Subscriber', attributes: ['id', 'name', 'email', 'phone_number'] },
          { model: Vendor, as: 'VendorSubscription', attributes: ['id', 'name' ,'logo'] }
        ]
      });
  
      const formatted = subscriptions.map(sub => ({
        userId: `USER${String(sub.userId).padStart(3, '0')}`,
        name: sub.Subscriber ? sub.Subscriber.name : 'N/A',
        vendorId: sub.VendorSubscription ? `VEND${String(sub.VendorSubscription.id).padStart(3, '0')}` : 'N/A',
        vendorName: sub.VendorSubscription ? sub.VendorSubscription.name : 'N/A', 
        vendorLogo: sub.VendorSubscription ? sub.VendorSubscription.logo : null, 
        subscriptionType: sub.endDate && sub.startDate
          ? `${Math.round((new Date(sub.endDate) - new Date(sub.startDate)) / (1000 * 60 * 60 * 24))} days`
          : 'N/A',
        startDate: sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : 'N/A',
        pendingBalance: `₹${sub.amount}`,
        countdown: 0,
        
        
      }));
  
      return res.success(HttpStatus.OK, true, 'Active users fetched successfully', formatted);
    } catch (error) {
      console.error('Active users error:', error);
      return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};

//get in active users................
adminController.getUsers = async (req, res) => {
    try {
        // Get all users with customer role
        const allUsers = await User.findAll({
            where: {
                role: 'customer'
            },
            attributes: ['id', 'name', 'email', 'phone_number', 'createdAt']
        });

        // Get users who have subscriptions (made orders)
        const subscribedUserIds = await Subscription.findAll({ attributes: ['userId'] });
        const subscribedIds = subscribedUserIds.map(sub => sub.userId);

        // Get addresses for users who have made orders
        const addresses = await Address.findAll({
            where: {
                userId: {
                    [Op.in]: subscribedIds
                },
                isDefault: true
            }
        });

        // Create a map of userId to address
        const addressMap = {};
        addresses.forEach(address => {
            addressMap[address.userId] = `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
        });

        const formatted = allUsers.map(user => {
            // Check if user has made an order (has subscription)
            const hasOrder = subscribedIds.includes(user.id);
            
            return {
                userId: `USER${String(user.id).padStart(3, '0')}`,
                name: user.name,
                phoneNumber: user.phone_number,
                // Include address only if user has made an order
                address: hasOrder ? (addressMap[user.id] || 'No default address') : '',
                email: user.email,
                joinDate: new Date(user.createdAt).toLocaleDateString('en-GB')
            };
        });

        return res.success(HttpStatus.OK, true, 'All users fetched successfully', formatted);
    } catch (error) {
        console.error('Users fetch error:', error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};
  
// Get past subscribers...............
adminController.getPastSubscribers = async (req, res) => {
    try {
        const currentDate = new Date();

        const pastSubscriptions = await Subscription.findAll({
            where: {
                endDate: {
                    [Op.lt]: currentDate
                }
            },
            include: [
                { 
                    model: User,
                    as: 'Subscriber',       // Use 'Subscriber' alias here
                    attributes: ['id', 'name']
                },
                { 
                    model: Vendor,
                    as: 'VendorSubscription',  // Use 'VendorSubscription' alias here
                    attributes: ['id', 'name']
                }
            ],
            order: [['endDate', 'DESC']]
        });

        const formatted = pastSubscriptions.map(sub => ({
            userId: `USER${String(sub.userId).padStart(3, '0')}`,
            name: sub.Subscriber ? sub.Subscriber.name : 'N/A',
            vendorId: sub.VendorSubscription ? `VEND${String(sub.VendorSubscription.id).padStart(3, '0')}` : 'N/A',
            startDate: sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : 'N/A',
            endDate: sub.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : 'N/A'
        }));

        return res.success(HttpStatus.OK, true, 'Past subscribers fetched successfully', formatted);
    } catch (error) {
        console.error('Past subscribers error:', error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};

// Admin approves or rejects the subscription
adminController.updateSubscriptionStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.error(HttpStatus.BAD_REQUEST, false, 'Status must be either "Approved" or "Rejected"', []);
    }

    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) {
      return res.error(HttpStatus.NOT_FOUND, false, 'Subscription not found', []);
    }

    // Prevent re-approval/rejection
    if (subscription.isAdminApproved && status === 'Approved') {
      return res.error(HttpStatus.BAD_REQUEST, false, 'Subscription already approved', []);
    }

    if (!subscription.isAdminApproved && status === 'Rejected') {
      return res.error(HttpStatus.BAD_REQUEST, false, 'Subscription already rejected', []);
    }

    // Update based on status
    if (status === 'Approved') {
      subscription.isAdminApproved = true;
    } else if (status === 'Rejected') {
      subscription.isAdminApproved = false;
    }

    await subscription.save();

    return res.success(
      HttpStatus.OK,
      true,
      `Subscription ${status.toLowerCase()} successfully`,
      subscription
    );
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

//admin get all orderr details 
adminController.getAllDailyOrders = async (req, res) => {
  try {
    // First check if there are any daily orders
    const orderCount = await DailyOrder.count();
    console.log(`Found ${orderCount} daily orders`);
    
    // If no orders exist, check if there are any active subscriptions
    if (orderCount === 0) {
      const activeSubscriptions = await Subscription.count({
        where: {
          status: 'Active',
          isAdminApproved: true
        }
      });
      console.log(`Found ${activeSubscriptions} active and approved subscriptions`);
      
      // If no active subscriptions, return helpful message
      if (activeSubscriptions === 0) {
        return res.success(HttpStatus.OK, true, 'No daily orders found. There are no active and approved subscriptions.', []);
      }
    }
    
    const orders = await DailyOrder.findAll({
      include: [
        {
          model: Subscription,
          as: 'DailyOrderSubscription',
          include: [
            {
              model: User,
              as: 'Subscriber',
              attributes: ['id', 'name', 'email', 'phone_number'],
              include: [
                {
                  model: Address,
                  as: 'Addresses',
                  attributes: ['addressLine1','addressLine2', 'city', 'state', 'pincode']
                }
              ]
            },
            {
              model: Vendor,
              as: 'VendorSubscription',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.success(HttpStatus.OK, true, 'All daily orders fetched successfully', orders);
  } catch (error) {
    console.error('Error fetching daily orders:', error);
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Get all subscriptions for admin
adminController.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [
        {
          model: User,
          as: 'Subscriber',
          attributes: ['id', 'name', 'email', 'phone_number'],
          include: [
            {
              model: Address,
              as: 'Addresses',
              attributes: ['addressLine1', 'addressLine2', 'city', 'state', 'pincode']
            }
          ]
        },
        {
          model: Vendor,
          as: 'VendorSubscription',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response data
    const formattedSubscriptions = subscriptions.map(subscription => {
      const sub = subscription.toJSON();
      
      // Calculate subscription duration in days
      const durationInDays = sub.startDate && sub.endDate
        ? Math.ceil((new Date(sub.endDate) - new Date(sub.startDate)) / (1000 * 60 * 60 * 24))
        : 'N/A';
      
      // Format user ID and vendor ID
      const formattedUserId = `USER${String(sub.userId).padStart(3, '0')}`;
      const formattedVendorId = sub.VendorSubscription
        ? `VEND${String(sub.VendorSubscription.id).padStart(3, '0')}`
        : 'N/A';
      
      // Get default address if available
      let defaultAddress = 'No address';
      if (sub.Subscriber && sub.Subscriber.Addresses && sub.Subscriber.Addresses.length > 0) {
        const address = sub.Subscriber.Addresses[0];
        defaultAddress = `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
      }
      
      return {
        id: sub.id,
        userId: formattedUserId,
        userName: sub.Subscriber ? sub.Subscriber.name : 'N/A',
        userEmail: sub.Subscriber ? sub.Subscriber.email : 'N/A',
        userPhone: sub.Subscriber ? sub.Subscriber.phone_number : 'N/A',
        userAddress: defaultAddress,
        vendorId: formattedVendorId,
        vendorName: sub.VendorSubscription ? sub.VendorSubscription.name : 'N/A',
        menuType: sub.menuType || 'N/A',
        mealTypes: sub.mealTypes || [],
        startDate: sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : 'N/A',
        endDate: sub.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : 'N/A',
        duration: `${durationInDays} days`,
        amount: `₹${sub.amount}`,
        status: sub.status,
        isAdminApproved: sub.isAdminApproved,
        createdAt: new Date(sub.createdAt).toLocaleString(),
        updatedAt: new Date(sub.updatedAt).toLocaleString()
      };
    });

    return res.success(HttpStatus.OK, true, 'All subscriptions fetched successfully', formattedSubscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

module.exports = adminController;