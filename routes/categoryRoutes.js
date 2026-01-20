const express = require("express");
const router = express.Router();
const { createCategory } = require("../controllers/categoryController");
const { verifyToken } = require("../middlewares/auth");
const { getCategories } = require("../controllers/categoryController");
const { deleteCategory } = require("../controllers/categoryController");
const { updateCategory } = require("../controllers/categoryController");
const { createProduct } = require("../controllers/productController");
const { getProducts } = require("../controllers/productController");
const { deleteProduct } = require("../controllers/productController");
const { updateProduct } = require("../controllers/productController");

//category related routes
router.post("/category/create", verifyToken, createCategory);
router.get("/categories", getCategories);
router.delete("/category/delete/:id", verifyToken, deleteCategory);
router.put("/category/update/:id", verifyToken, updateCategory);

//product related route
router.post("/product/create", verifyToken, createProduct);
router.get("/products", getProducts);
router.delete("/product/delete/:id", verifyToken, deleteProduct);
router.put("/product/update/:id", verifyToken, updateProduct);

module.exports = router;
