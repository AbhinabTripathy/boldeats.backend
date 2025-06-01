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
    const { status } = req.body;

    // Only allow specific statuses
    if (!['Completed', 'Pending', 'Rejected'].includes(status)) {
        return res.error(HttpStatus.BAD_REQUEST, false, 'Invalid status provided', []);
    }

    const normalizedPaymentId = paymentId.toUpperCase();

    const payment = await Payment.findOne({
        where: { paymentId: normalizedPaymentId }
    });

    if (!payment) {
        return res.error(HttpStatus.NOT_FOUND, false, 'Payment not found', []);
    }

    // If already processed, avoid re-processing
    if (payment.status === 'Completed' || payment.status === 'Rejected') {
        return res.error(HttpStatus.BAD_REQUEST, false, 'Payment already processed', []);
    }

    // Start transaction
    const t = await sequelize.transaction();
    try {
        payment.status = status;
        await payment.save({ transaction: t });

        // Only process wallet/subscription if marked as Completed
        if (status === 'Completed') {
            // Update wallet
            let wallet = await Wallet.findOne({ where: { userId: payment.userId } });
            if (!wallet) {
                wallet = await Wallet.create({ userId: payment.userId, amount: payment.amount }, { transaction: t });
            } else {
                wallet.amount += payment.amount;
                await wallet.save({ transaction: t });
            }

            // Fetch Cart to get plan details
            const cartItem = await Cart.findOne({
                where: { userId: payment.userId, vendorId: payment.vendorId },
                order: [['createdAt', 'DESC']]
            });

            if (!cartItem) {
                await t.rollback();
                return res.error(HttpStatus.BAD_REQUEST, false, 'Cart data not found for subscription', []);
            }

            // Calculate endDate based on planType
            const durationDays = cartItem.planType === '15days' ? 15 : 30;
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + durationDays);

            // Create Subscription
            await Subscription.create({
                userId: payment.userId,
                vendorId: payment.vendorId,
                menuType: 'Veg', // Optional: Fetch from vendor if needed
                mealTypes: [],   // Optional: can be set from cart if stored
                startDate,
                endDate,
                amount: payment.amount,
                paymentId: payment.paymentId
            }, { transaction: t });
        }

        await t.commit();
        return res.success(HttpStatus.OK, true, 'Payment status updated successfully', payment);
    } catch (error) {
        await t.rollback();
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
