const express = require("express");
const router = express.Router();
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// All cart routes require authentication
// router.get("/", verifyToken, getCart);
router.get("/", getCart);
// router.post("/add", verifyToken, addToCart);
router.post("/add", addToCart);
// router.put("/update", verifyToken, updateCartItem);
router.put("/update", updateCartItem);
// router.delete("/remove/:productId", verifyToken, removeFromCart);
router.delete("/remove/:productId", removeFromCart);
router.get("/remove/:productId", removeFromCart);
// router.delete("/clear", verifyToken, clearCart);
router.delete("/clear", clearCart);

module.exports = router;
