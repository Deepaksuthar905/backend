const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mydb";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Routes
const categoryRoutes = require("./routes/categoryRoutes");
const auth = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const addressRoutes = require("./routes/address");
const wishlistRoutes = require("./routes/wishlist");

app.use("/", auth);
app.use("/api", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Direct routes without /api prefix for convenience
const { getCategories } = require("./controllers/categoryController");
const { getProducts } = require("./controllers/productController");
app.get("/categories", getCategories);
app.get("/products", getProducts);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
