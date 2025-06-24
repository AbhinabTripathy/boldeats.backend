const { Cart, Vendor, Address } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');

const cartController = {};

cartController.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vendorId, planType, quantity, menuType, mealTypes } = req.body;

    if (!vendorId || !planType || !quantity) {
      return res.error(HttpStatus.BAD_REQUEST, false, 'All fields are required', []);
    }

    // Check if user has at least one saved address
    const hasAddress = await Address.findOne({ where: { userId } });
    if (!hasAddress) {
      return res.error(HttpStatus.BAD_REQUEST, false, 'Please add a delivery address before adding items to cart.', []);
    }

    // Validate vendor
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.error(HttpStatus.NOT_FOUND, false, 'Vendor not found', []);
    }

    // Determine price based on selected plan
    let pricePerUnit = 0;
    if (planType === '15days') {
      pricePerUnit = vendor.subscriptionPrice15Days;
    } else if (planType === '30days') {
      pricePerUnit = vendor.subscriptionPriceMonthly;
    } else {
      return res.error(HttpStatus.BAD_REQUEST, false, 'Invalid planType', []);
    }

    const totalPrice = quantity * parseInt(pricePerUnit);

    //Create the cart entry
    const cartItem = await Cart.create({
      userId,
      vendorId,
      planType,
      menuType: menuType || 'both', // Default to 'both' if not provided
      mealTypes: mealTypes || JSON.stringify(['Breakfast', 'Lunch', 'Dinner']), // Default value if not provided
      quantity,
      pricePerUnit,
      totalPrice
    });

    return res.success(HttpStatus.CREATED, true, 'Item added to cart', cartItem);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Get Cart
cartController.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({ where: { userId } });
    return res.success(HttpStatus.OK, true, 'Cart fetched successfully', cartItems);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};

// Remove from Cart
cartController.removeFromCart = async (req, res) => {
  try {
    const cartItemId = req.params.cartItemId;  
    const userId = req.user.id;

    const item = await Cart.findOne({ where: { id: cartItemId, userId } });

    if (!item) {
      return res.error(HttpStatus.NOT_FOUND, false, 'Cart item not found', []);
    }

    await item.destroy();
    return res.success(HttpStatus.OK, true, 'Item removed from cart', []);
  } catch (error) {
    return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, error.message, []);
  }
};






module.exports = cartController;
