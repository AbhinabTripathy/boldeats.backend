const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Vendor = require('./vendor.model');

const MenuSection = sequelize.define('menuSections', {
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
    menuType: {
        type: DataTypes.ENUM('Veg', 'Non-Veg','both'),
        allowNull: false
    },
    mealType: {
        type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner'),
        allowNull: false
    },
    sectionName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MENU 1'
    }
}, {
    timestamps: true
});

// Define relationships
Vendor.hasMany(MenuSection, { foreignKey: 'vendorId' });
MenuSection.belongsTo(Vendor, { foreignKey: 'vendorId' });

module.exports = MenuSection;