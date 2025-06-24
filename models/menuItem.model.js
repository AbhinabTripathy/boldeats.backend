const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Vendor = require('./vendor.model');
const MenuPhoto = require('./menuPhoto.model');
const MenuSection = require('./menuSection.model');

const MenuItem = sequelize.define('menuItems', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    menuSectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: MenuSection,
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
    dayOfWeek: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

// Define relationships
Vendor.hasMany(MenuItem, { foreignKey: 'vendorId', as: 'menuItems' });
MenuItem.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

MenuSection.hasMany(MenuItem, { foreignKey: 'menuSectionId' });

// Define relationship with MenuPhoto
MenuItem.hasMany(MenuPhoto, { foreignKey: 'menuItemId', as: 'menuPhotos' });
MenuPhoto.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });
MenuItem.belongsTo(MenuSection, { foreignKey: 'menuSectionId' });

// Add the association with MenuPhoto
MenuItem.hasMany(MenuPhoto, { foreignKey: 'menuItemId' });
MenuPhoto.belongsTo(MenuItem, { foreignKey: 'menuItemId' });

module.exports = MenuItem;