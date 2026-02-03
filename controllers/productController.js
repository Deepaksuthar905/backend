const Product = require("../models/products");

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category").populate("subcategory");
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
        error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ 
        message: "Product not found", 
      });
    }
    return res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
        error: error.message,
    });
    }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    return res.status(200).json({
      message: "Product fetched successfully",
      data: product,
    });
  }
  catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId }).populate("category").populate("subcategory");
    if (products.length === 0) {
      return res.status(404).json({
        message: "Products not found for this category",
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
    });
  }
  catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

exports.getProductsBySubcategory = async (req, res) => {
  try {
    const products = await Product.find({ subcategory: req.params.subcategoryId }).populate("category").populate("subcategory");
    if (products.length === 0) {
      return res.status(404).json({
        message: "Products not found for this subcategory",
      });
    }
    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};