const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },

    // Parent listing product (null = root). Child rows = color/SKU variants (Flipkart-style).
    parentProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Optional color label for variant rows (e.g. "Navy", "Red").
    color: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
    },

    images: [
      {
        type: String, // image URLs or file names
      }
    ],

    sizes: [
      {
        name: { type: String, default: "" },
        id: { type: String, required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
        price: { type: Number },
        stock: { type: Number },
      }
    ],

    material: {
      type: String,           // steel, brass, wood
    },

    brand: {
      type: String,           // Fevicol, Greenply
    },

    unit: {
      type: String,           // piece, kg, sheet
      default: "piece"
    },

    stock: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Product", ProductSchema);
