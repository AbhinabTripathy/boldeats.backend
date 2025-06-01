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
    menuType: {
        type: DataTypes.ENUM('Veg', 'Non-Veg', 'Both'),
        allowNull: false
    },
    mealTypes: {
        type: DataTypes.JSON,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Active', 'Expired', 'Cancelled'),
        defaultValue: 'Active'
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'payments',
            key: 'paymentId'
        }
    }
}, {
    timestamps: true
});

User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

Vendor.hasMany(Subscription, { foreignKey: 'vendorId' });
Subscription.belongsTo(Vendor, { foreignKey: 'vendorId' });

module.exports = Subscription;