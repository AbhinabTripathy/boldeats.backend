const { Payment, Wallet, Cart ,User ,Vendor,Subscription } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const sequelize = require('../config/db');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/receipts';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'receipt-' + Date.now() + ext);
    }
});

const upload = multer({ storage }).single('receipt');

// Upload receipt
exports.uploadReceipt = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.error(HttpStatus.BAD_REQUEST, false, err.message, []);

        const { amount, method } = req.body;
        const userId = req.user.id;

        if (!amount || !method || !req.file) {
            return res.error(HttpStatus.BAD_REQUEST, false, 'All fields are required', []);
        }

        // Check if user has items in cart
        const cartItems = await Cart.findAll({ where: { userId } });
        if (!cartItems || cartItems.length === 0) {
            return res.error(HttpStatus.BAD_REQUEST, false, 'Your cart is empty. Add items before making payment.', []);
        }

        // Get latest vendorId from cart
        const lastCartItem = cartItems[cartItems.length - 1];
        const vendorId = lastCartItem.vendorId;

        const payment = await Payment.create({
            userId,
            vendorId,
            amount,
            method,
            receipt: req.file.path,
            status: 'PENDING'
        });

        return res.success(HttpStatus.CREATED, true, 'Receipt uploaded. Awaiting approval.', payment);
    });
};

// Admin approves payment
exports.approvePayment = async (req, res) => {
    const { paymentId } = req.params;
    const normalizedPaymentId = paymentId.toUpperCase();

    const payment = await Payment.findOne({
        where: {
            paymentId: normalizedPaymentId,
            status: 'Pending'
        }
    });

    if (!payment) {
        return res.error(HttpStatus.NOT_FOUND, false, 'Invalid payment or already processed', []);
    }

    const t = await sequelize.transaction();

    try {
        // 1. Mark payment as completed
        payment.status = 'Completed';
        await payment.save({ transaction: t });

        // 2. Update/Add wallet
        let wallet = await Wallet.findOne({ where: { userId: payment.userId } });
        if (!wallet) {
            wallet = await Wallet.create({ userId: payment.userId, amount: payment.amount }, { transaction: t });
        } else {
            wallet.amount += payment.amount;
            await wallet.save({ transaction: t });
        }

        // 3. Fetch last cart item to create subscription
        const cartItems = await Cart.findAll({ where: { userId: payment.userId } });
        if (!cartItems || cartItems.length === 0) {
            await t.rollback();
            return res.error(HttpStatus.BAD_REQUEST, false, 'Cart is empty. Cannot create subscription.', []);
        }

        const latestCart = cartItems[cartItems.length - 1];
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (latestCart.planType === '15days' ? 15 : 30));

        await Subscription.create({
            userId: payment.userId,
            vendorId: latestCart.vendorId,
            menuType: latestCart.menuType,
            mealTypes: latestCart.mealTypes,
            startDate,
            endDate,
            amount: latestCart.totalPrice,
            paymentId: payment.paymentId,
            status: 'Active'
        }, { transaction: t });

        await t.commit();
        return res.success(HttpStatus.OK, true, 'Payment approved and subscription created successfully', []);
    } catch (error) {
        await t.rollback();
        console.error("approvePayment error:", error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};





// Get wallet balance
exports.getWallet = async (req, res) => {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.success(HttpStatus.OK, true, 'Wallet empty', { amount: 0 });
    return res.success(HttpStatus.OK, true, 'Wallet fetched', wallet);
};


// Get all payments for admin panel
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [
                { 
                    model: User,
                    as: 'User',  
                    attributes: ['id', 'name'] 
                },
                { 
                    model: Vendor,
                    as: 'Vendor',  
                    attributes: ['id', 'name'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const formattedPayments = payments.map(payment => ({
            serialNumber: payment.id,
            paymentId: payment.paymentId,
            userId: payment.userId,
            customerName: payment.User?.name || 'N/A',   
            vendorId: payment.vendorId,
            vendorName: payment.Vendor?.name || 'N/A',     
            amount: payment.amount,
            paymentMethod: payment.method,
            status: payment.status,
            receipt: payment.receipt
        }));

        return res.success(HttpStatus.OK, true, 'Payments fetched successfully', formattedPayments);
    } catch (error) {
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};
