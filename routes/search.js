const express = require("express");
const router = express.Router();
const {
  search,
  searchProducts,
  searchSuggestions,
} = require("../controllers/searchController");

// Main search - products + categories
router.get("/", search);

// Search only products (with filters)
router.get("/products", searchProducts);

// Get search suggestions (autocomplete)
router.get("/suggestions", searchSuggestions);

module.exports = router;
