const { Address } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');

const addressController = {};

// Add new address
addressController.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    if (!addressLine1 || !city || !state || !pincode) {
      return res.error(HttpStatus.BAD_REQUEST, false, 'All required fields must be filled.', []);
    }

    // If isDefault is true, reset others
    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const newAddress = await Address.create({
      userId,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault: !!isDefault
    });

    return res.success(HttpStatus.CREATED, true, 'Address added successfully', newAddress);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Get all addresses of user
addressController.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.findAll({ where: { userId } });
    return res.success(HttpStatus.OK, true, 'Addresses fetched successfully', addresses);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Update an address
addressController.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { addressLine1, addressLine2, city, state, pincode } = req.body;

    const address = await Address.findOne({ where: { id, userId } });
    if (!address) {
      return res.error(HttpStatus.NOT_FOUND, false, 'Address not found', []);
    }

    await address.update({ addressLine1, addressLine2, city, state, pincode });
    return res.success(HttpStatus.OK, true, 'Address updated successfully', address);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Delete an address
addressController.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await Address.destroy({ where: { id, userId } });
    if (!deleted) {
      return res.error(HttpStatus.NOT_FOUND, false, 'Address not found', []);
    }

    return res.success(HttpStatus.OK, true, 'Address deleted successfully', []);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Set default address
addressController.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Unset previous default
    await Address.update({ isDefault: false }, { where: { userId } });

    // Set new default
    const updated = await Address.update({ isDefault: true }, { where: { id, userId } });

    if (!updated[0]) {
      return res.error(HttpStatus.NOT_FOUND, false, 'Address not found', []);
    }

    return res.success(HttpStatus.OK, true, 'Default address set successfully', []);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

module.exports = addressController;
