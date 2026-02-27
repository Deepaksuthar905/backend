const path = require("path");
const fs = require("fs");
let sharp;
try { sharp = require("sharp"); } catch (_) { sharp = null; }
const Product = require("../models/products");
const Size = require("../models/Size");

const PRODUCT_IMAGES_DIR = path.join(__dirname, "../uploads/products");
const COMPRESS = { maxWidth: 1200, maxHeight: 1200, jpegQuality: 85 };

async function normalizeSizes(sizes, productId = null) {
  if (!Array.isArray(sizes) || sizes.length === 0) return sizes;
  const out = [];
  for (const item of sizes) {
    let name = item && (item.size || item.name || item.label || "");
    let id = item && (item.id || item._id);
    if (!name && Size && id) {
      const doc = await Size.findById(id).lean();
      if (doc) name = doc.name || doc.value || String(id);
    }
    if (!name && id) name = String(id);
    if (!id) id = name;  // sirf { size: "7" } bheja to id = "7"
    if (name === "" && !id) continue;
    if (!name) name = String(id);
    out.push({
      name: String(name),
      id: String(id),
      productId: productId || item.productId || null,
    });
  }
  return out;
}

function sizesForResponse(product) {
  if (!product) return product;
  const doc = product.toObject ? product.toObject() : product;
  if (Array.isArray(doc.sizes)) {
    doc.sizes = doc.sizes.map((s) => ({ name: s.name }));
  }
  return doc;
}

function productsForResponse(products) {
  if (!Array.isArray(products)) return sizesForResponse(products);
  return products.map((p) => sizesForResponse(p));
}

// Size table (collection) mein bhi save karo – product ke sizes ke hisaab se
async function saveSizesToSizeTable(product) {
  if (!product || !product.sizes || product.sizes.length === 0) return;
  const productId = product._id;
  for (const s of product.sizes) {
    const name = (s && s.name) || (s && s.size) || "";
    if (!name) continue;
    await Size.findOneAndUpdate(
      { product: productId, name: String(name) },
      {
        name: String(name),
        value: (s && s.id) || name,
        product: productId,
        status: "active",
      },
      { upsert: true, new: true }
    );
  }
}

function getFileBuffers(req) {
  const list = [];
  if (!req.files) return list;
  const fields = ["images", "image", "file", "files"];
  for (const field of fields) {
    const f = req.files[field];
    if (!f) continue;
    const arr = Array.isArray(f) ? f : [f];
    for (const file of arr) {
      if (file && (file.buffer || file.path)) list.push(file);
    }
  }
  return list;
}


async function compressAndSaveProductImages(req) {
  const files = getFileBuffers(req);
  if (files.length === 0) return [];
  if (!fs.existsSync(PRODUCT_IMAGES_DIR)) fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
  const paths = [];
  const { maxWidth, maxHeight, jpegQuality } = COMPRESS;
  for (const file of files) {
    const input = file.buffer || (file.path && fs.readFileSync(file.path));
    if (!input) continue;
    const base = Date.now() + "_" + Math.random().toString(36).slice(2);
    const ext = (file.originalname && path.extname(file.originalname)) || ".jpg";
    const name = sharp ? base + ".jpg" : base + "." + (ext.replace(/^\./, "") || "jpg").toLowerCase();
    const outPath = path.join(PRODUCT_IMAGES_DIR, name);
    const urlPath = "/uploads/products/" + name;
    if (sharp) {
      try {
        await sharp(input)
          .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: jpegQuality })
          .toFile(outPath);
        paths.push(urlPath);
      } catch (err) {
        try {
          fs.writeFileSync(outPath, input);
          paths.push(urlPath);
        } catch (e) {
          console.warn("Image save failed:", e.message);
        }
      }
    } else {
      try {
        fs.writeFileSync(outPath, input);
        paths.push(urlPath);
      } catch (e) {
        console.warn("Image save failed:", e.message);
      }
    }
  }
  return paths;
}

exports.createProduct = async (req, res) => {
  try {
    const uploaded = await compressAndSaveProductImages(req);
    if (uploaded.length) req.body.images = uploaded;
    if (req.body.sizes && req.body.sizes.length) {
      req.body.sizes = await normalizeSizes(req.body.sizes);
    }
    const product = await Product.create(req.body);
    if (product.sizes && product.sizes.length) {
      product.sizes.forEach((s) => { s.productId = product._id; });
      await product.save();
      await saveSizesToSizeTable(product);
    }
    await product.populate(["category", "subcategory"]);
    return res.status(201).json({
      message: "Product created successfully",
      data: sizesForResponse(product),
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
      data: productsForResponse(products),
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
    const uploaded = await compressAndSaveProductImages(req);
    if (uploaded.length) {
      const existing = (req.body.images && Array.isArray(req.body.images)) ? req.body.images : [];
      req.body.images = [...existing, ...uploaded];
    }
    if (req.body.sizes && req.body.sizes.length) {
      req.body.sizes = await normalizeSizes(req.body.sizes, req.params.id);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("category").populate("subcategory");
    if (!product) {
      return res.status(404).json({ 
        message: "Product not found", 
      });
    }
    if (product.sizes && product.sizes.length) {
      await saveSizesToSizeTable(product);
    }
    return res.status(200).json({
      message: "Product updated successfully",
      data: sizesForResponse(product),
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
    const product = await Product.findById(req.params.id).populate("category").populate("subcategory");
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    return res.status(200).json({
      message: "Product fetched successfully",
      data: sizesForResponse(product),
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
      data: productsForResponse(products),
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
      data: productsForResponse(products),
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};