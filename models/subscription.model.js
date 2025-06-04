const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');
const Vendor = require('./vendor.model');

const Subscription = sequelize.define('subscriptions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  menuType: {
    type: DataTypes.STRING
  },
  mealTypes: {
    type: DataTypes.JSON
  },
  startDate: {
    type: DataTypes.DATEONLY
  },
  endDate: {
    type: DataTypes.DATEONLY
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  paymentId: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  isAdminApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// // Define associations
// Subscription.belongsTo(User, { foreignKey: 'userId', as: 'User' });
// Subscription.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'Vendor' });

module.exports = Subscription;
