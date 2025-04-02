const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('orders', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    orderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Order;