const Subcategory = require("../models/subcategory");
const Category = require("../models/Category");

exports.createSubcategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const cat = await Category.findById(category);
    if (!cat) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = await Subcategory.create({ name, category });
    await subcategory.populate("category");

    return res.status(201).json({
      message: "Subcategory created successfully",
      data: subcategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Subcategory with this name already exists in this category",
      });
    }
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate("category");
    return res.status(200).json({
      message: "Subcategories fetched successfully",
      data: subcategories,
      count: subcategories.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subcategories = await Subcategory.find({ category: categoryId }).populate("category");
    return res.status(200).json({
      message: "Subcategories fetched successfully",
      data: subcategories,
      count: subcategories.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate("category");
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    return res.status(200).json({
      message: "Subcategory fetched successfully",
      data: subcategory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, status } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (category !== undefined) update.category = category;
    if (status !== undefined) update.status = status;

    const subcategory = await Subcategory.findByIdAndUpdate(id, update, {
      new: true,
    }).populate("category");

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    return res.status(200).json({
      message: "Subcategory updated successfully",
      data: subcategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Subcategory with this name already exists in this category",
      });
    }
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    return res.status(200).json({
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
