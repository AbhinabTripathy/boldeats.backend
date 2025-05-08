const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Vendor = require('./vendor.model');

const MenuItem = sequelize.define('menuItems', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Vendor,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

// Define relationship
Vendor.hasMany(MenuItem, { foreignKey: 'vendorId' });
MenuItem.belongsTo(Vendor, { foreignKey: 'vendorId' });

module.exports = MenuItem;