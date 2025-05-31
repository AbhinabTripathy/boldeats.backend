const { Payment, Wallet } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
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

        const payment = await Payment.create({
            userId,
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
            status: 'Pending'   // use exact case as in ENUM
        }
    });

    if (!payment) {
        return res.error(HttpStatus.NOT_FOUND, false, 'Invalid payment or already processed', []);
    }

    payment.status = 'Completed';  // or 'Approved' if you want, but your ENUM is 'Completed'
    await payment.save();

    // Update wallet
    let wallet = await Wallet.findOne({ where: { userId: payment.userId } });
    if (!wallet) {
        wallet = await Wallet.create({ userId: payment.userId, amount: payment.amount });
    } else {
        wallet.amount += payment.amount;
        await wallet.save();
    }

    return res.success(HttpStatus.OK, true, 'Payment approved and wallet updated', wallet);
};




// Get wallet balance
exports.getWallet = async (req, res) => {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) return res.success(HttpStatus.OK, true, 'Wallet empty', { amount: 0 });
    return res.success(HttpStatus.OK, true, 'Wallet fetched', wallet);
};
