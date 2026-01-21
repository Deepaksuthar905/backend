const Wishlist = require("../models/wishlist");
const Product = require("../models/products");

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId }).populate("products");

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    return res.status(200).json({
      message: "Wishlist fetched successfully",
      data: wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { productId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

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

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    // Check if product already in wishlist
    if (wishlist.products.includes(productId)) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    // Add product to wishlist
    wishlist.products.push(productId);
    await wishlist.save();
    await wishlist.populate("products");

    return res.status(200).json({
      message: "Product added to wishlist successfully",
      data: wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || req.query?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    // Check if product exists in wishlist
    if (!wishlist.products.includes(productId)) {
      return res.status(404).json({
        message: "Product not found in wishlist",
      });
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );
    await wishlist.save();
    await wishlist.populate("products");

    return res.status(200).json({
      message: "Product removed from wishlist successfully",
      data: wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
