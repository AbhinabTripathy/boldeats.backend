const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Vendor = require('./vendor.model');

const MenuPhoto = sequelize.define('menuPhotos', {
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
    menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    photoUrl: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true
});

// Define relationships
Vendor.hasMany(MenuPhoto, { foreignKey: 'vendorId', as: 'menuPhotos' });
MenuPhoto.belongsTo(Vendor, { foreignKey: 'vendorId' });

module.exports = MenuPhoto;