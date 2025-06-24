const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');
const Vendor = require('./vendor.model');

const Cart = sequelize.define('carts', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Vendor,
      key: 'id'
    }
  },
  planType: {
    type: DataTypes.ENUM('15days', '30days'),
    allowNull: false
  },
  menuType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mealTypes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pricePerUnit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.belongsTo(Vendor, { foreignKey: 'vendorId' });

module.exports = Cart;
