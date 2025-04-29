const { Cart, CartItem, User } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const cartController = {};

// Add thali to cart
cartController.addToCart = async (req, res) => {
    try {   
        const userId = req.user.id;
        const { thaliId, quantity, type } = req.body;

        // Validate input
        if (!thaliId || !quantity || !type) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Thali ID, quantity, and type are required",
                []
            );
        }

        // Find or create user's cart
        let [cart, created] = await Cart.findOrCreate({
            where: { userId },
            defaults: { totalAmount: 0 }
        });

        // Check if item already exists in cart
        const existingItem = await CartItem.findOne({
            where: { 
                cartId: cart.id,
                thaliId,
                type
            }
        });

        // Set price based on thali type
        const price = 99; // fixed price for all thalis

        if (existingItem) {
            // Update quantity if item already exists
            await existingItem.update({
                quantity: existingItem.quantity + parseInt(quantity),
                totalPrice: discountedPrice * (existingItem.quantity + parseInt(quantity))
            });
        } else {
            // Create new cart item
            await CartItem.create({
                cartId: cart.id,
                thaliId,
                type,
                quantity: parseInt(quantity),
                price,
                totalPrice: discountedPrice * parseInt(quantity)
            });
        } 

        // Update cart total
        const cartItems = await CartItem.findAll({
            where: { cartId: cart.id }
        });

        const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        await cart.update({ totalAmount });

        // Get updated cart with items
        const updatedCart = await Cart.findOne({
            where: { id: cart.id },
            include: [{
                model: CartItem,
                as: 'items'
            }]
        });

        return res.success(
            HttpStatus.OK,
            "true",
            "Item added to cart successfully",
            { cart: updatedCart }
        );
    } catch (error) {
        console.error("Error adding to cart:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get cart
cartController.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get cart with items
        const cart = await Cart.findOne({
            where: { userId },
            include: [{
                model: CartItem,
                as: 'items'
            }]
        });

        if (!cart) {
            return res.success(
                HttpStatus.OK,
                "true",
                "Cart is empty",
                { cart: { items: [], totalAmount: 0 } }
            );
        }

        return res.success(
            HttpStatus.OK,
            "true",
            "Cart fetched successfully",
            { cart }
        );
    } catch (error) {
        console.error("Error fetching cart:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Update cart item quantity
cartController.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId, quantity } = req.body;

        // Validate input
        if (!cartItemId || !quantity) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Cart item ID and quantity are required",
                []
            );
        }

        // Get user's cart
        const cart = await Cart.findOne({
            where: { userId }
        });

        if (!cart) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Cart not found",
                []
            );
        }

        // Find cart item
        const cartItem = await CartItem.findOne({
            where: {
                id: cartItemId,
                cartId: cart.id
            }
        });

        if (!cartItem) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Cart item not found",
                []
            );
        }

        // Update quantity
        if (parseInt(quantity) <= 0) {
            // Remove item if quantity is 0 or negative
            await cartItem.destroy();
        } else {
            // Update quantity
            await cartItem.update({
                quantity: parseInt(quantity),
                totalPrice: 79 * parseInt(quantity) // Using discounted price
            });
        }

        // Update cart total
        const cartItems = await CartItem.findAll({
            where: { cartId: cart.id }
        });

        const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        await cart.update({ totalAmount });

        // Get updated cart with items
        const updatedCart = await Cart.findOne({
            where: { id: cart.id },
            include: [{
                model: CartItem,
                as: 'items'
            }]
        });

        return res.success(
            HttpStatus.OK,
            "true",
            "Cart updated successfully",
            { cart: updatedCart }
        );
    } catch (error) {
        console.error("Error updating cart:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Remove item from cart
cartController.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params;

        // Get user's cart
        const cart = await Cart.findOne({
            where: { userId }
        });

        if (!cart) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Cart not found",
                []
            );
        }

        // Find cart item
        const cartItem = await CartItem.findOne({
            where: {
                id: cartItemId,
                cartId: cart.id
            }
        });

        if (!cartItem) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Cart item not found",
                []
            );
        }

        // Remove item
        await cartItem.destroy();

        // Update cart total
        const cartItems = await CartItem.findAll({
            where: { cartId: cart.id }
        });

        const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        await cart.update({ totalAmount });

        // Get updated cart with items
        const updatedCart = await Cart.findOne({
            where: { id: cart.id },
            include: [{
                model: CartItem,
                as: 'items'
            }]
        });

        return res.success(
            HttpStatus.OK,
            "true",
            "Item removed from cart successfully",
            { cart: updatedCart }
        );
    } catch (error) {
        console.error("Error removing from cart:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Clear cart
cartController.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's cart
        const cart = await Cart.findOne({
            where: { userId }
        });

        if (!cart) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Cart not found",
                []
            );
        }

        // Remove all items
        await CartItem.destroy({
            where: { cartId: cart.id }
        });

        // Update cart total
        await cart.update({ totalAmount: 0 });

        return res.success(
            HttpStatus.OK,
            "true",
            "Cart cleared successfully",
            { cart: { id: cart.id, userId, totalAmount: 0, items: [] } }
        );
    } catch (error) {
        console.error("Error clearing cart:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = cartController;