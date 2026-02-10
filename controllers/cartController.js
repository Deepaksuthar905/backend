const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/products");

// Cart response mein har item ke product ki sizes = sirf selected size
function cartForResponse(cart) {
  if (!cart) return cart;
  const doc = cart.toObject ? cart.toObject() : cart;
  if (Array.isArray(doc.items)) {
    doc.items = doc.items.map((item) => {
      const selected = item.selectedSize;
      if (item.product && selected != null && selected !== "") {
        item.product = { ...item.product, sizes: [{ name: String(selected) }] };
      }
      return item;
    });
  }
  return doc;
}

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";
    let cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], total: 0 });
    }

    return res.status(200).json({
      message: "Cart fetched successfully",
      data: cartForResponse(cart),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add item to cart (selectedSize / size = jo size user ne choose ki, e.g. "3" ya { name: "3", id: "..." })
function getSelectedSizeFromBody(body) {
  const raw = body.selectedSize != null ? body.selectedSize : body.size;
  if (raw == null || raw === "") return null;
  if (typeof raw === "object" && raw !== null) {
    const v = raw.name || raw.id || raw.value || "";
    return String(v).trim() || null;
  }
  return String(raw).trim() || null;
}

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], total: 0 });
    }

    const sizeStr = getSelectedSizeFromBody(req.body);
    const existingItemIndex = cart.items.findIndex((item) => {
      const sameProduct = item.product.toString() === String(productId);
      const sameSize = (item.selectedSize || "") === (sizeStr || "");
      return sameProduct && sameSize;
    });

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        selectedSize: sizeStr || undefined,
      });
    }

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Item added to cart successfully",
      data: cartForResponse(cart),
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
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";
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
      data: cartForResponse(cart),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Remove item from cart (productId = product _id ya cart item _id dono chalega)
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";
    const productId = (req.params.productId || req.query.productId || "").trim();
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: String(userId) });
    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const pid = String(productId).trim();
    const beforeCount = cart.items.length;
    let pidObj;
    try {
      pidObj = new mongoose.Types.ObjectId(pid);
    } catch (e) {
      pidObj = null;
    }
    cart.items = cart.items.filter((item) => {
      const productIdStr = item.product && (item.product._id != null ? String(item.product._id) : String(item.product));
      const cartItemIdStr = item._id != null ? String(item._id) : "";
      if (productIdStr === pid || cartItemIdStr === pid) return false;
      if (pidObj && item.product) {
        const itemProdId = item.product._id || item.product;
        if (mongoose.Types.ObjectId.isValid(itemProdId) && pidObj.equals(itemProdId)) return false;
      }
      if (pidObj && item._id && pidObj.equals(item._id)) return false;
      return true;
    });
    const removed = beforeCount > cart.items.length;

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: removed ? "Item removed from cart successfully" : "Item not found in cart",
      data: cartForResponse(cart),
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
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";

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
      data: cartForResponse(cart),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
