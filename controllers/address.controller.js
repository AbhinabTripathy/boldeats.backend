const { address } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const addressController = {};

// Add new address
addressController.addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

        // Validate input
        if (!addressLine1 || !city || !state || !pincode) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Address line 1, city, state, and pincode are required",
                []
            );
        }

        // If this is set as default, unset any existing default
        if (isDefault) {
            await address.update(
                { isDefault: false },
                { where: { userId } }
            );
        }

        // Create new address
        const newAddress = await address.create({
            userId,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            isDefault: isDefault || false
        });

        return res.success(
            HttpStatus.CREATED,
            "true",
            "Address added successfully",
            { address: newAddress }
        );
    } catch (error) {
        console.error("Error adding address:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get all addresses
addressController.getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all addresses for user
        const addresses = await address.findAll({
            where: { userId },
            order: [['isDefault', 'DESC']] // Default address first
        });

        return res.success(
            HttpStatus.OK,
            "true",
            "Addresses fetched successfully",
            { addresses }
        );
    } catch (error) {
        console.error("Error fetching addresses:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Update address
addressController.updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

        // Find address
        const userAddress = await address.findOne({
            where: {
                id,
                userId
            }
        });

        if (!userAddress) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Address not found",
                []
            );
        }

        // If this is set as default, unset any existing default
        if (isDefault) {
            await address.update(
                { isDefault: false },
                { where: { userId } }
            );
        }

        // Update address
        await userAddress.update({
            addressLine1: addressLine1 || userAddress.addressLine1,
            addressLine2: addressLine2 !== undefined ? addressLine2 : userAddress.addressLine2,
            city: city || userAddress.city,
            state: state || userAddress.state,
            pincode: pincode || userAddress.pincode,
            isDefault: isDefault !== undefined ? isDefault : userAddress.isDefault
        });

        return res.success(
            HttpStatus.OK,
            "true",
            "Address updated successfully",
            { address: userAddress }
        );
    } catch (error) {
        console.error("Error updating address:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Delete address
addressController.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Find address
        const userAddress = await address.findOne({
            where: {
                id,
                userId
            }
        });

        if (!userAddress) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Address not found",
                []
            );
        }

        // Delete address
        await userAddress.destroy();

        // If deleted address was default, set another as default if available
        if (userAddress.isDefault) {
            const anotherAddress = await address.findOne({
                where: { userId }
            });

            if (anotherAddress) {
                await anotherAddress.update({ isDefault: true });
            }
        }

        return res.success(
            HttpStatus.OK,
            "true",
            "Address deleted successfully",
            {}
        );
    } catch (error) {
        console.error("Error deleting address:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Set default address
addressController.setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Find address
        const userAddress = await address.findOne({
            where: {
                id,
                userId
            }
        });

        if (!userAddress) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Address not found",
                []
            );
        }

        // Unset any existing default
        await address.update(
            { isDefault: false },
            { where: { userId } }
        );

        // Set as default
        await userAddress.update({ isDefault: true });

        return res.success(
            HttpStatus.OK,
            "true",
            "Default address set successfully",
            { address: userAddress }
        );
    } catch (error) {
        console.error("Error setting default address:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = addressController;