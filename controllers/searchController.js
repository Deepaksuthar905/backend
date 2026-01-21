const Product = require("../models/products");
const Category = require("../models/Category");

// Search products and categories
exports.search = async (req, res) => {
  try {
    const { q } = req.query; // search query

    if (!q || q.trim() === "") {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const searchQuery = q.trim();

    // Create regex for case-insensitive search
    const searchRegex = new RegExp(searchQuery, "i");

    // Search in products (name, description)
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
      ],
    }).populate("category");

    // Search in categories (name)
    const categories = await Category.find({
      name: searchRegex,
    });

    // Get products from matching categories
    const categoryIds = categories.map((cat) => cat._id);
    const productsByCategory = await Product.find({
      category: { $in: categoryIds },
    }).populate("category");

    // Merge and remove duplicates from products
    const allProducts = [...products];
    productsByCategory.forEach((product) => {
      if (!allProducts.find((p) => p._id.toString() === product._id.toString())) {
        allProducts.push(product);
      }
    });

    return res.status(200).json({
      message: "Search results fetched successfully",
      data: {
        query: searchQuery,
        products: allProducts,
        categories: categories,
        totalProducts: allProducts.length,
        totalCategories: categories.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Search only products
exports.searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Build filter query
    let filter = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
      ],
    };

    // Filter by category if provided
    if (category) {
      filter.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort options
    let sortOptions = {};
    if (sortBy === "price_low") sortOptions.price = 1;
    else if (sortBy === "price_high") sortOptions.price = -1;
    else if (sortBy === "newest") sortOptions.created_at = -1;
    else if (sortBy === "name") sortOptions.name = 1;
    else sortOptions.created_at = -1; // default: newest first

    const products = await Product.find(filter)
      .populate("category")
      .sort(sortOptions);

    return res.status(200).json({
      message: "Products fetched successfully",
      data: {
        query: q.trim(),
        products: products,
        total: products.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get search suggestions (autocomplete)
exports.searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(200).json({
        message: "Suggestions fetched",
        data: {
          suggestions: [],
        },
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Get product name suggestions (limit to 5)
    const productSuggestions = await Product.find({ name: searchRegex })
      .select("name")
      .limit(5);

    // Get category name suggestions (limit to 3)
    const categorySuggestions = await Category.find({ name: searchRegex })
      .select("name")
      .limit(3);

    const suggestions = [
      ...productSuggestions.map((p) => ({ type: "product", name: p.name, id: p._id })),
      ...categorySuggestions.map((c) => ({ type: "category", name: c.name, id: c._id })),
    ];

    return res.status(200).json({
      message: "Suggestions fetched successfully",
      data: {
        query: q.trim(),
        suggestions: suggestions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
