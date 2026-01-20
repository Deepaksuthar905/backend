const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/orderController");

// All order routes require authentication
router.post("/create", verifyToken, createOrder);
router.get("/", verifyToken, getUserOrders);
router.get("/all", verifyToken, getAllOrders); // Admin only
router.get("/:id", verifyToken, getOrder);
router.put("/:id/status", verifyToken, updateOrderStatus); // Admin only

module.exports = router;
