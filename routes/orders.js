const express = require("express");
const router = express.Router();
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/orderController");

// All order routes require authentication
// router.post("/create", verifyToken, createOrder);
router.post("/create", createOrder);
// router.get("/", verifyToken, getUserOrders);
router.get("/", getUserOrders);
// router.get("/all", verifyToken, getAllOrders); // Admin only
router.get("/all", getAllOrders); // Admin only
// router.get("/:id", verifyToken, getOrder);
router.get("/:id", getOrder);
// router.put("/:id/status", verifyToken, updateOrderStatus); // Admin only
router.put("/:id/status", updateOrderStatus); // Admin only

module.exports = router;
