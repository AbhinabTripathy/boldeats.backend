const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Subscription = require('./subscription.model');
const Vendor = require('./vendor.model');

const DailyOrder = sequelize.define('daily_orders', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    subscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Subscription,
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
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected', 'Skipped'),
        defaultValue: 'Pending'
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    extendedSubscription: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});


module.exports = DailyOrder;
