const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const Vendor = sequelize.define('vendors', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gstin: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fssaiNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fssaiCertificate: {
        type: DataTypes.STRING,
        allowNull: false
    },
    accountHolderName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    accountNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ifscCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bankName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    branch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    openingTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    closingTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subscriptionPrice15Days: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    subscriptionPriceMonthly: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    yearsInBusiness: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 5.0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: true
});

module.exports = Vendor;