const express = require("express");
const router = express.Router();
const { createCategory } = require("../controllers/categoryController");
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const { getCategories } = require("../controllers/categoryController");
const { deleteCategory } = require("../controllers/categoryController");
const { updateCategory } = require("../controllers/categoryController");
const { createProduct } = require("../controllers/productController");
const { getProducts } = require("../controllers/productController");
const { deleteProduct } = require("../controllers/productController");
const { updateProduct } = require("../controllers/productController");
const { getProductById, getProductsByCategory } = require("../controllers/productController");
//category related routes
// router.post("/category/create", verifyToken, createCategory);
router.post("/category/create", createCategory);
router.get("/categories", getCategories);
// router.delete("/category/delete/:id", verifyToken, deleteCategory);
router.delete("/category/delete/:id", deleteCategory);
// router.put("/category/update/:id", verifyToken, updateCategory);
router.put("/category/update/:id", updateCategory);

//product related route
// router.post("/product/create", verifyToken, createProduct);
router.post("/product/create", createProduct);
router.get("/products", getProducts);
// router.delete("/product/delete/:id", verifyToken, deleteProduct);
router.delete("/product/delete/:id", deleteProduct);
// router.put("/product/update/:id", verifyToken, updateProduct);
router.put("/product/update/:id", updateProduct);
router.get("/product/:id", getProductById);
router.get("/products/category/:categoryId", getProductsByCategory);
module.exports = router;
