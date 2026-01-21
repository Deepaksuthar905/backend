const express = require("express");
const router = express.Router();
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

// Get user's wishlist
router.get("/", getWishlist);

// Add product to wishlist
router.post("/add", addToWishlist);

// Remove product from wishlist
router.delete("/remove/:productId", removeFromWishlist);

module.exports = router;
