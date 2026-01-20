const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await Category.create({ name });

    return res.status(201).json({
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    console.log(`Found ${categories.length} categories`);
    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: "internal server error",
      error: error.message
    });
  } 
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    } 
    return res.status(200).json({
      message: "Category deleted successfully",
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message
    });
  } 
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { name, status },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message
    });
  } 
};