const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/products");

// Create order from cart OR from request body (items)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.user || req.body?.userId || req.query?.userId || "000000000000000000000000";
    const { shippingAddress, paymentMethod, paymentScreenshot, items: bodyItems, total: bodyTotal } = req.body;

    let orderItems = [];
    let total = 0;
    let sourceItems = [];

    // Option 1: Use items from request body if provided
    if (bodyItems && Array.isArray(bodyItems) && bodyItems.length > 0) {
      sourceItems = bodyItems;
      for (const item of bodyItems) {
        const productId = item.product && (item.product._id || item.product);
        if (!productId) continue;
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            message: `Product not found`,
          });
        }
        if (product.stock < (item.quantity || 1)) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`,
          });
        }
        const price = item.price != null ? item.price : product.price;
        const qty = item.quantity || 1;
        orderItems.push({
          product: product._id,
          quantity: qty,
          price,
        });
        total += price * qty;
      }
      if (bodyTotal != null && bodyTotal !== undefined) total = Number(bodyTotal);
    } else {
      // Option 2: Use cart from DB
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          message: "Cart is empty",
        });
      }
      sourceItems = cart.items;
      for (const item of cart.items) {
        const product = await Product.findById(item.product._id);
        if (!product) {
          return res.status(404).json({
            message: `Product ${item.product.name} not found`,
          });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`,
          });
        }
        orderItems.push({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
        });
        total += item.price * item.quantity;
      }
    }

    // Payment method: only cod or qr
    const method = paymentMethod === "qr" ? "qr" : "cod";
    if (method === "qr" && !paymentScreenshot) {
      return res.status(400).json({
        message: "Payment screenshot is required for QR payment",
      });
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      total,
      shippingAddress: shippingAddress || {},
      paymentMethod: method,
      paymentScreenshot: paymentScreenshot || null,
      status: "pending",
      paymentStatus: "pending",
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's cart after order
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.total = 0;
      await cart.save();
    }

    await order.populate("items.product");

    return res.status(201).json({
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";

    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .sort({ created_at: -1 });

    return res.status(200).json({
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    // Temporary: Use userId from query/body or default to a dummy user
    const userId = req.user?.id || req.body?.userId || req.query?.userId || "000000000000000000000000";

    const order = await Order.findOne({ _id: id, user: userId }).populate(
      "items.product"
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    // Temporary: Commented out admin check
    // Check if user is admin
    // if (req.user?.role !== "admin") {
    //   return res.status(403).json({
    //     message: "Access denied. Admin only.",
    //   });
    // }

    const order = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { new: true }
    ).populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    // Temporary: Commented out admin check
    // Check if user is admin
    // if (req.user?.role !== "admin") {
    //   return res.status(403).json({
    //     message: "Access denied. Admin only.",
    //   });
    // }

    const orders = await Order.find()
      .populate("items.product")
      .populate("user", "name email phone")
      .sort({ created_at: -1 });

    return res.status(200).json({
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Upload payment screenshot (for QR payment)
exports.uploadPaymentScreenshot = async (req, res) => {
  try {
    const file = req.file
      || req.files?.screenshot?.[0]
      || req.files?.file?.[0]
      || req.files?.image?.[0];
    if (!file) {
      return res.status(400).json({
        message: "No screenshot file uploaded. Use form field: screenshot, file, or image",
      });
    }
    const screenshotUrl = "/uploads/screenshots/" + file.filename;
    return res.status(200).json({
      success: true,
      message: "Screenshot uploaded successfully",
      screenshotUrl,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
