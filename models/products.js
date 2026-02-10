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
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },  // ye size kis product ki
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
