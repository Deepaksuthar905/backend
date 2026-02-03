const express = require("express");
const router = express.Router();
const {
  createSubcategory,
  getSubcategories,
  getSubcategoriesByCategory,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} = require("../controllers/subcategoryController");

router.post("/subcategory/create", createSubcategory);
router.get("/subcategories", getSubcategories);
router.get("/subcategories/category/:categoryId", getSubcategoriesByCategory);
router.get("/subcategory/:id", getSubcategoryById);
router.put("/subcategory/update/:id", updateSubcategory);
router.delete("/subcategory/delete/:id", deleteSubcategory);

module.exports = router;
