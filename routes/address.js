const express = require("express");
const router = express.Router();
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const {
  getAddresses,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

// Get all addresses of user
router.get("/", getAddresses);

// Get single address
router.get("/:id", getAddressById);

// Add new address
router.post("/add", addAddress);

// Update address
router.put("/update/:id", updateAddress);

// Delete address
router.delete("/delete/:id", deleteAddress);

// Set address as default
router.put("/default/:id", setDefaultAddress);

module.exports = router;
