const User = require('./user.model');
const Vendor = require('./vendor.model');
const MenuItem = require('./menuItem.model');
const MenuPhoto = require('./menuPhoto.model');
const Address = require('./address.model');
const Payment = require('./payment.model');
const MenuSection = require('./menuSection.model');
const Cart = require('./cart.model');
const Wallet = require('./wallet.model');
const Subscription = require('./subscription.model');
const DailyOrder = require('./dailyOrder.model');

// Define associations
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'Subscriber' });
Subscription.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'VendorSubscription' });

Subscription.hasMany(DailyOrder, { foreignKey: 'subscriptionId', as: 'dailyOrders' });

DailyOrder.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'DailyOrderSubscription' });
DailyOrder.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'VendorOrder' });

User.hasMany(Address, { foreignKey: 'userId', as: 'Addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'User' });

module.exports = {
  User,
  Vendor,
  MenuItem,
  MenuPhoto,
  Address,
  Payment,
  MenuSection,
  Cart,
  Wallet,
  Subscription,
  DailyOrder  
};
