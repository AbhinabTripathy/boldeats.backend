const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');
const Vendor = require('./vendor.model'); // ✅ Add this

const Payment = sequelize.define('payments', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  paymentId: {
    type: DataTypes.STRING,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Rejected'),
    defaultValue: 'Pending'
  },
  receipt: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

// Auto-generate paymentId like PAY001
Payment.beforeCreate(async (payment, options) => {
  const last = await Payment.findOne({ order: [['id', 'DESC']] });
  const lastId = last ? parseInt(last.paymentId?.replace('PAY', '')) || 0 : 0;
  payment.paymentId = 'PAY' + String(lastId + 1).padStart(3, '0');
});

// Define associations
Payment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User'
});

Payment.belongsTo(Vendor, {
    foreignKey: 'vendorId',
    as: 'Vendor'
});

module.exports = Payment;
