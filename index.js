const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

// CORS - allow frontend (change origin in .env if needed)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true, // true = reflect request origin; or set e.g. "http://localhost:5173"
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded files (e.g. payment screenshots)
app.use("/uploads", express.static("uploads"));

// DB connection – use MONGO_URI from .env (Atlas connection string)
const connectDB = require("./config/db");
connectDB();

// Routes
const categoryRoutes = require("./routes/categoryRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const auth = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const addressRoutes = require("./routes/address");
const wishlistRoutes = require("./routes/wishlist");
const searchRoutes = require("./routes/search");

app.use("/", auth);
app.use("/api", auth);
app.use("/api", categoryRoutes);
app.use("/api", subcategoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/search", searchRoutes);

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
