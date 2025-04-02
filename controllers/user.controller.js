const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, OtpVerification } = require('../models');  
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');

const userController = {};

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

userController.register = async (req, res) => {
    try {
        const { name, email, phone_number, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({  
            where: {
                [Op.or]: [{ email }, { phone_number }]
            }
        });

        if (existingUser && existingUser.isVerified) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                ResponseMessages.User_Exist,
                []
            );
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        

       //for testing only
        console.log(`TEST MODE - OTP for testing: ${otp}`);


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create or update user with unverified status
        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: {
                name,
                email,
                phone_number,
                password: hashedPassword,
                role: 'customer',
                isVerified: false
            }
        });

        // Store OTP
        await OtpVerification.create({  
            userId: user.id,
            otp: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Temporarily skip email sending for testing
        /*
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is: ${otp}. Valid for 10 minutes.`
        };

        await transporter.sendMail(mailOptions);
        */

        return res.success(
            HttpStatus.OK,
            "true",
            "OTP sent to email for verification",
            { email }
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

userController.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ where: { email } });  
        if (!user) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "User not found",
                []
            );
        }

        const otpRecord = await OtpVerification.findOne({  
            where: {
                userId: user.id,
                otp: otp,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!otpRecord) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Invalid or expired OTP",
                []
            );
        }

        // Update user verification status
        await user.update({ isVerified: true });
        await otpRecord.destroy();

        return res.success(
            HttpStatus.OK,
            "true",
            "Email verified successfully",
            { email }
        );

    } catch (error) {
        console.error("Error in OTP verification:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

userController.login = async (req, res) => {
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

        // Find user by email
        const user = await User.findOne({ 
            where: { email },
            attributes: ['id', 'name', 'email', 'password', 'role', 'isVerified'] 
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
                "Please verify your email first",
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
//get profile data........................................
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

module.exports = userController;