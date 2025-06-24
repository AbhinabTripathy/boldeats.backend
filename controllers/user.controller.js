const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { User, Vendor,Payment, MenuItem, MenuPhoto ,Subscription } = require('../models');

const userController = {};



// Register a user
userController.register = async (req, res) => {
    try {
        const { name, email, phone_number, password } = req.body;

        // Validate required fields
        if (!name || !email || !phone_number || !password) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "All fields are required",
                []
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({  
            where: {
                [Op.or]: [{ email }, { phone_number }]
            }
        });

        if (existingUser) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "User with this email or phone number already exists",
                []
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with verified status
        const user = await User.create({
            name,
            email,
            phone_number,
            password: hashedPassword,
            role: 'customer',
            isVerified: true // Set to true by default
        });

        // Generate JWT token for immediate login
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                role: user.role 
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;

        return res.success(
            HttpStatus.CREATED,
            "true",
            "Registration successful",
            {
                user: userResponse,
                token
            }
        );

    } catch (error) {
        console.error("Error in registration:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Update the login function to handle both email and phone number login
userController.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Email/Phone and password are required",
                []
            );
        }

        // Find user by email or phone number
        const user = await User.findOne({ 
            where: {
                [Op.or]: [
                    { email: email },
                    { phone_number: email } // Allow login with phone number too
                ]
            },
            attributes: ['id', 'name', 'email', 'phone_number', 'password', 'role', 'isVerified'] 
        });

        if (!user) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "User not found",
                []
            );
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                "false",
                "Please verify your account first",
                []
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
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
                id: user.id,
                email: user.email,
                role: user.role 
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;

        return res.success(
            HttpStatus.OK,
            "true",
            "Login successful",
            {
                user: userResponse,
                token
            }
        );

    } catch (error) {
        console.error("Login error:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            "Internal server error",
            error
        );
    }
};
//get profile data.......................................
userController.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; 

        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'name', 'email', 'phone_number', 'wallet_balance', 'role']
        });

        if (!user) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "User not found",
                []
            );
        }

        return res.success(
            HttpStatus.OK,
            "true",
            "Profile fetched successfully",
            { user }
        );

    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            "Internal server error",
            error
        );
    }
};

// Update user profile
userController.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone } = req.body;
        
        // Find user
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "User not found",
                []
            );
        }
        
        // Check if email is being changed and if it's already in use
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.error(
                    HttpStatus.CONFLICT,
                    "false",
                    "Email already in use",
                    []
                );
            }
        }
        
        // Check if phone is being changed and if it's already in use
        if (phone && phone !== user.phone) {
            const existingUser = await User.findOne({ where: { phone } });
            if (existingUser) {
                return res.error(
                    HttpStatus.CONFLICT,
                    "false",
                    "Phone number already in use",
                    []
                );
            }
        }
        
        // Update user
        await user.update({
            name: name || user.name,
            email: email || user.email,
            phone: phone || user.phone
        });
        
        // Return updated user without password
        const updatedUser = await User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password'] }
        });
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Profile updated successfully",
            { user: updatedUser }
        );
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get all vendors with their menu items
userController.getAllVendors = async (req, res) => {
    try {
        // Include both menu items and menu photos directly associated with the vendor
        const vendors = await Vendor.findAll({
            include: [
                {
                    model: MenuItem,
                    as: 'menuItems',
                    include: [{
                        model: MenuPhoto,
                        as: 'menuPhotos'
                    }]
                },
                {
                    model: MenuPhoto,
                    as: 'menuPhotos',
                    required: false
                }
            ],
            attributes: [
                'id', 'name', 'logo', 'phoneNumber', 'address',
                'fssaiNumber', 'yearsInBusiness', 'openingTime',
                'closingTime', 'rating',
                'subscriptionPrice15Days', 'subscriptionPriceMonthly'
            ],
            where: { isActive: true }  
        });

        return res.success(
            HttpStatus.OK,
            "true",
            "Vendors fetched successfully",
            vendors
        );
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            "Error fetching vendors",
            error
        );
    }
};

// Get vendor details by ID
userController.getVendorDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vendor = await Vendor.findOne({
            where: { id },
            include: [{
                model: MenuItem,
                as:'menuItems',
                include: [MenuPhoto]
            }],
            attributes: [
                'id', 'name', 'logo', 'phoneNumber', 'address',
                'fssaiNumber', 'yearsInBusiness', 'openingTime',
                'closingTime', 'rating',
                'subscriptionPrice15Days', 'subscriptionPriceMonthly'
            ]
        });

        if (!vendor) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Vendor not found"
            );
        }

        // Get vendor data
        const vendorData = vendor.toJSON();

        return res.success(
            HttpStatus.OK,
            "true",
            "Vendor details fetched successfully",
            vendorData
        );
    } catch (error) {
        console.error('Error fetching vendor details:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            "Error fetching vendor details",
            error
        );
    }
};

// Get active subscription of the logged-in user
userController.getUserSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const payment = await Payment.findOne({
            where: {
                userId,
                status: 'Completed'
            },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Vendor,
                    as: 'Vendor',
                    attributes: [
                        'id', 'name', 'logo', 'phoneNumber', 'address',
                        'fssaiNumber', 'yearsInBusiness', 'openingTime',
                        'closingTime', 'menuType', 'rating',
                        'subscriptionPrice15Days', 'subscriptionPriceMonthly',
                        'mealTypes'
                    ]
                }
            ]
        });

        if (!payment) {
            return res.success(200, true, 'No subscription found', null);
        }

        // Find the subscription details
        const subscription = await Subscription.findOne({
            where: {
                userId,
                paymentId: payment.paymentId,
                status: 'Active'
            }
        });

        // Format meal types if it's stored as a string
        let mealTypes = payment.Vendor?.mealTypes;
        if (typeof mealTypes === 'string') {
            try {
                mealTypes = JSON.parse(mealTypes);
            } catch (e) {
                console.error('Error parsing mealTypes:', e);
                // Keep as is if parsing fails
            }
        }

        // Calculate subscription duration
        let duration = '30 days';
        if (subscription && subscription.startDate && subscription.endDate) {
            const start = new Date(subscription.startDate);
            const end = new Date(subscription.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            duration = `${diffDays} days`;
        }

        return res.success(200, true, 'Subscription fetched successfully', {
            planAmount: payment.amount,
            method: payment.method,
            vendor: {
                id: payment.Vendor?.id,
                name: payment.Vendor?.name,
                logo: payment.Vendor?.logo,
                address: payment.Vendor?.address,
                phoneNumber: payment.Vendor?.phoneNumber,
                yearsInBusiness: payment.Vendor?.yearsInBusiness,
                openingTime: payment.Vendor?.openingTime,
                closingTime: payment.Vendor?.closingTime,
                rating: payment.Vendor?.rating
            },
            subscription: {
                menuType: subscription?.menuType || payment.Vendor?.menuType,
                mealTypes: mealTypes || [],
                startDate: subscription?.startDate,
                endDate: subscription?.endDate,
                duration: duration,
                status: subscription?.status || 'Active'
            }
        });
    } catch (error) {
        console.error('Subscription fetch error:', error);
        return res.error(500, false, 'Failed to fetch subscription', error);
    }
};


module.exports = userController;