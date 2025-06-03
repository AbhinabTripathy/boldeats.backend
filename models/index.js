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


// Export all models
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