const { DailyOrder, Subscription, User, Wallet } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const sequelize = require('../config/db');
const { Op } = require('sequelize');


const dailyOrderController = {};

//get daily orders for a vendor
dailyOrderController.getVendorDailyOrders = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const orders = await DailyOrder.findAll({
            where: {
                vendorId,
                date: today
            },
            include: [{
                model: Subscription,
                as: 'DailyOrderSubscription',
                include: [{
                    model: User,
                    as: 'Subscriber',
                    attributes: ['name', 'phone_number']
                }]
            }]
        });

        return res.success(HttpStatus.OK, true, 'Daily orders fetched successfully', orders);
    } catch (error) {
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};


// Accept or reject daily order
dailyOrderController.updateOrderStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const { status, reason } = req.body;
        const vendorId = req.user.id;

        if (!['Accepted', 'Rejected', 'Skipped'].includes(status)) {
            return res.error(HttpStatus.BAD_REQUEST, false, 'Invalid status', []);
        }

        const order = await DailyOrder.findOne({
            where: { id: orderId, vendorId },
            include: [{
                model: Subscription,
                as: 'DailyOrderSubscription',
                include: [{
                    model: User,
                    as: 'Subscriber'
                }]
            }]
        });

        if (!order) {
            return res.error(HttpStatus.NOT_FOUND, false, 'Order not found', []);
        }

        // Calculate daily amount
        const totalDays = Math.ceil(
            (new Date(order.DailyOrderSubscription.endDate) - new Date(order.DailyOrderSubscription.startDate)) / (1000 * 60 * 60 * 24)
        );
        const dailyAmount = order.DailyOrderSubscription.amount / totalDays;

        // Update order status
        order.status = status;
        order.reason = reason;
        await order.save({ transaction: t });

        // If order is rejected or skipped, refund the daily amount to user's wallet
        if (status === 'Rejected' || status === 'Skipped') {
            const wallet = await Wallet.findOne({
                where: { userId: order.DailyOrderSubscription.Subscriber.id },
                transaction: t
            });

            if (wallet) {
                wallet.amount += dailyAmount;
                await wallet.save({ transaction: t });
            }
        }

        await t.commit();
        return res.success(HttpStatus.OK, true, 'Order status updated successfully', order);
    } catch (error) {
        await t.rollback();
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};


// Scheduled task to create daily orders
dailyOrderController.createDailyOrders = async () => {
    const t = await sequelize.transaction();
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get all active subscriptions
        const activeSubscriptions = await Subscription.findAll({
            where: {
                status: 'Active',
                isAdminApproved: true,
                startDate: { [Op.lte]: today },
                endDate: { [Op.gte]: today }
              }
        });

        // Create daily orders for each subscription
        for (const subscription of activeSubscriptions) {
            await DailyOrder.create({
                subscriptionId: subscription.id,
                vendorId: subscription.vendorId,
                date: today
            }, { transaction: t });

            // Deduct daily amount from user's wallet
            const totalDays = Math.ceil(
                (new Date(subscription.endDate) - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24)
            );
            const dailyAmount = subscription.amount / totalDays;

            const wallet = await Wallet.findOne({
                where: { userId: subscription.userId },
                transaction: t
            });

            if (wallet) {
                wallet.amount -= dailyAmount;
                await wallet.save({ transaction: t });
            }
        }

        await t.commit();
        console.log('Daily orders created successfully');
    } catch (error) {
        await t.rollback();
        console.error('Error creating daily orders:', error);
    }
};

module.exports = dailyOrderController;