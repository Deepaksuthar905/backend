const Cart = require("../models/cart");
const Product = require("../models/products");

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body.userId || req.query.userId || "000000000000000000000000";
    let cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], total: 0 });
    }

    return res.status(200).json({
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body.userId || req.query.userId || "000000000000000000000000";
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], total: 0 });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price,
      });
    }

    // Calculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Item added to cart successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body.userId || req.query.userId || "000000000000000000000000";
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        message: "Product ID and valid quantity are required",
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body.userId || req.query.userId || "000000000000000000000000";
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Item removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body.userId || req.query.userId || "000000000000000000000000";

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.total = 0;

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
