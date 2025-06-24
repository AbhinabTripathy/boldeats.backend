const { DailyOrder, Subscription, User, Wallet,Address,Vendor } = require('../models');
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
                    attributes: ['name', 'phone_number',],
                    include:[{
                        model:Address,
                        as:"Addresses",
                        attributes:['addressLine1' ,'addressLine2' ,'city' ,'state' ,'pincode']
                    }]
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
        // and extend subscription by one day
        if (status === 'Rejected' || status === 'Skipped') {
            const wallet = await Wallet.findOne({
                where: { userId: order.DailyOrderSubscription.Subscriber.id },
                transaction: t
            });

            if (wallet) {
                wallet.amount += dailyAmount;
                await wallet.save({ transaction: t });
            }
            
            // Extend subscription end date by one day
            const subscription = await Subscription.findByPk(order.subscriptionId, { transaction: t });
            if (subscription) {
                const currentEndDate = new Date(subscription.endDate);
                currentEndDate.setDate(currentEndDate.getDate() + 1);
                subscription.endDate = currentEndDate.toISOString().split('T')[0];
                await subscription.save({ transaction: t });
                
                // Mark this order as having extended the subscription
                order.extendedSubscription = true;
                await order.save({ transaction: t });
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

// Get subscription details with order history
dailyOrderController.getSubscriptionDetails = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        
        const subscription = await Subscription.findByPk(subscriptionId, {
            include: [
                { 
                    model: User, 
                    as: 'Subscriber',
                    attributes: ['id', 'name', 'email', 'phone_number']
                },
                { 
                    model: Vendor, 
                    as: 'VendorSubscription',
                    attributes: ['id', 'name']
                }
            ]
        });
        
        if (!subscription) {
            return res.error(HttpStatus.NOT_FOUND, false, 'Subscription not found', []);
        }
        
        // Get all orders for this subscription
        const orders = await DailyOrder.findAll({
            where: { subscriptionId },
            order: [['date', 'DESC']]
        });
        
        // Calculate subscription duration
        const totalDays = Math.ceil(
            (new Date(subscription.endDate) - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24)
        );
        
        // Count extended days
        const extendedDays = orders.filter(order => order.extendedSubscription).length;
        
        // Format the response
        const formattedResponse = {
            userInformation: {
                name: subscription.Subscriber.name,
                id: `USER${String(subscription.userId).padStart(3, '0')}`,
                vendorId: `VEND${String(subscription.vendorId).padStart(3, '0')}`
            },
            subscriptionSummary: {
                duration: `${totalDays} days`,
                amountPaid: `₹${parseFloat(subscription.amount).toFixed(2)}`
            },
            subscriptionPeriod: {
                originalDates: {
                    start: subscription.startDate,
                    end: new Date(new Date(subscription.startDate).setDate(
                        new Date(subscription.startDate).getDate() + totalDays - extendedDays - 1
                    )).toISOString().split('T')[0]
                },
                adjustedDates: {
                    start: subscription.startDate,
                    end: subscription.endDate,
                    extendedDays: extendedDays > 0 ? `(+${extendedDays} days)` : ''
                }
            },
            orderHistory: orders.map(order => ({
                date: order.date,
                status: order.status,
                reason: order.reason || '',
                extended: order.extendedSubscription
            }))
        };
        
        return res.success(HttpStatus.OK, true, 'Subscription details fetched successfully', formattedResponse);
    } catch (error) {
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
    }
};

module.exports = dailyOrderController;