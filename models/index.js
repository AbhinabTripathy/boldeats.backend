const User = require('./user.model');
const cart=require('./cart.model');
const cartItem=require('./cartItem.model');
const address=require('./address.model');
const Order=require('./order.model');
const Payment=require('./payment.model');
const OtpVerification = require('./otpVerification.model');

// Define associations
User.hasMany(OtpVerification, {
    foreignKey: 'userId',
    as: 'otpVerifications'
});

OtpVerification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasOne(cart, { foreignKey: 'userId' });
cart.belongsTo(User, { foreignKey: 'userId' });

cart.hasMany(cartItem, { foreignKey: 'cartId', as: 'items' });
cartItem.belongsTo(cart, { foreignKey: 'cartId' });

User.hasMany(address, { foreignKey: 'userId' });
address.belongsTo(User, { foreignKey: 'userId' });

// Add Order and Payment relationships
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasOne(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
    User,
    OtpVerification,
    cart,
    cartItem,
    address,
    Order,
    Payment
};


