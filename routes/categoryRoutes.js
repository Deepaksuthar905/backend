const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { createCategory } = require("../controllers/categoryController");
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const { getCategories } = require("../controllers/categoryController");
const { deleteCategory } = require("../controllers/categoryController");
const { updateCategory } = require("../controllers/categoryController");
const { createProduct } = require("../controllers/productController");
const { getProducts } = require("../controllers/productController");
const { deleteProduct } = require("../controllers/productController");
const { updateProduct } = require("../controllers/productController");
const { getProductById, getProductsByCategory, getProductsBySubcategory } = require("../controllers/productController");

// Product images upload (multer)
const uploadsDir = path.join(__dirname, "../uploads");
const productImagesDir = path.join(__dirname, "../uploads/products");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(productImagesDir)) fs.mkdirSync(productImagesDir, { recursive: true });
// Memory storage – controller me compress karke save karenge
const productStorage = multer.memoryStorage();
const uploadProductImages = multer({ storage: productStorage }).fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 10 },
  { name: "file", maxCount: 10 },
  { name: "files", maxCount: 10 },
]);

//category related routes
// router.post("/category/create", verifyToken, createCategory);
router.post("/category/create", createCategory);
router.get("/categories", getCategories);
// router.delete("/category/delete/:id", verifyToken, deleteCategory);
router.delete("/category/delete/:id", deleteCategory);
// router.put("/category/update/:id", verifyToken, updateCategory);
router.put("/category/update/:id", updateCategory);

//product related route (with image upload)
// router.post("/product/create", verifyToken, uploadProductImages, createProduct);
router.post("/product/create", uploadProductImages, createProduct);
router.get("/products", getProducts);
// router.delete("/product/delete/:id", verifyToken, deleteProduct);
router.delete("/product/delete/:id", deleteProduct);
// router.put("/product/update/:id", verifyToken, updateProduct);
router.put("/product/update/:id", uploadProductImages, updateProduct);
router.get("/product/:id", getProductById);
router.get("/products/category/:categoryId", getProductsByCategory);
router.get("/products/subcategory/:subcategoryId", getProductsBySubcategory);
module.exports = router;
