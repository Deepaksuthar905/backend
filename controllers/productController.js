const path = require("path");
const fs = require("fs");
let sharp;
try { sharp = require("sharp"); } catch (_) { sharp = null; }
const Product = require("../models/products");
const Size = require("../models/Size");

const PRODUCT_IMAGES_DIR = path.join(__dirname, "../uploads/products");
const COMPRESS = { maxWidth: 1200, maxHeight: 1200, jpegQuality: 85 };

function parseJsonArrayMaybe(input) {
  if (Array.isArray(input)) return input;
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;
  // Common when request is multipart/form-data: req.body.sizes = "[{...}]"
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }
  return null;
}

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
    const row = {
      name: String(name),
      id: String(id),
      productId: productId || item.productId || null,
    };
    if (item.price != null && item.price !== "") row.price = Number(item.price);
    if (item.stock != null && item.stock !== "") row.stock = Number(item.stock);
    out.push(row);
  }
  return out;
}

function sizesForResponse(product) {
  if (!product) return product;
  const doc = product.toObject ? product.toObject() : product;
  if (Array.isArray(doc.sizes)) {
    doc.sizes = doc.sizes.map((s) => {
      const o = { name: s.name, id: s.id };
      if (s.price != null && !Number.isNaN(Number(s.price))) o.price = Number(s.price);
      if (s.stock != null && !Number.isNaN(Number(s.stock))) o.stock = Number(s.stock);
      return o;
    });
  }
  if (doc.parentProduct && typeof doc.parentProduct === "object" && doc.parentProduct._id) {
    doc.parentProduct = doc.parentProduct._id;
  }
  return doc;
}

function productsForResponse(products) {
  if (!Array.isArray(products)) return sizesForResponse(products);
  return products.map((p) => sizesForResponse(p));
}

function rootProductFilter() {
  return { $or: [{ parentProduct: null }, { parentProduct: { $exists: false } }] };
}

async function collectPricesFromProductDoc(p) {
  const list = [p.price];
  if (p.sizes && p.sizes.length) {
    for (const s of p.sizes) {
      if (s.price != null && !Number.isNaN(Number(s.price))) list.push(Number(s.price));
    }
  }
  return list;
}

async function enrichStoreProductRow(parent) {
  const children = await Product.find({ parentProduct: parent._id }).lean();
  let allPrices = await collectPricesFromProductDoc(parent.toObject ? parent.toObject() : parent);
  for (const c of children) {
    allPrices = allPrices.concat(await collectPricesFromProductDoc(c));
  }
  allPrices = allPrices.filter((n) => n != null && !Number.isNaN(n));
  const min = allPrices.length ? Math.min(...allPrices) : parent.price;
  const max = allPrices.length ? Math.max(...allPrices) : parent.price;
  const doc = sizesForResponse(parent);
  doc.variantCount = children.length;
  doc.priceMin = min;
  doc.priceMax = max;
  return doc;
}

exports.enrichStoreProductRow = enrichStoreProductRow;
exports.rootProductFilter = rootProductFilter;

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
    if (req.body.parentProduct) {
      const par = await Product.findById(req.body.parentProduct).lean();
      if (!par) {
        return res.status(400).json({ message: "Parent product not found", error: "invalid parentProduct" });
      }
      if (!req.body.category) req.body.category = par.category;
      if (req.body.subcategory == null && par.subcategory) req.body.subcategory = par.subcategory;
    }
    // Multer (multipart/form-data) may give nested arrays as JSON strings.
    if (typeof req.body.images === "string") {
      const parsed = parseJsonArrayMaybe(req.body.images);
      if (parsed) req.body.images = parsed;
    }
    if (req.body.sizes) {
      const parsed = parseJsonArrayMaybe(req.body.sizes);
      if (parsed) req.body.sizes = parsed;
      if (Array.isArray(req.body.sizes) && req.body.sizes.length) {
        req.body.sizes = await normalizeSizes(req.body.sizes);
      }
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
    const group = req.query.groupVariants === "1" || req.query.groupVariants === "true";
    if (group) {
      const parents = await Product.find(rootProductFilter())
        .populate("category")
        .populate("subcategory");
      const data = await Promise.all(parents.map((p) => enrichStoreProductRow(p)));
      return res.status(200).json({
        message: "Products fetched successfully",
        data,
      });
    }
    const products = await Product.find()
      .populate("category")
      .populate("subcategory")
      .populate("parentProduct");
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
    // Multer (multipart/form-data) may give nested arrays as JSON strings.
    if (typeof req.body.images === "string") {
      const parsed = parseJsonArrayMaybe(req.body.images);
      if (parsed) req.body.images = parsed;
    }
    if (req.body.sizes) {
      const parsed = parseJsonArrayMaybe(req.body.sizes);
      if (parsed) req.body.sizes = parsed;
      if (Array.isArray(req.body.sizes) && req.body.sizes.length) {
        req.body.sizes = await normalizeSizes(req.body.sizes, req.params.id);
      }
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        message: "Product not found", 
      });
    }
    Object.keys(req.body || {}).forEach((k) => {
      product[k] = req.body[k];
    });
    if (req.body.sizes) {
      // Explicitly mark nested size matrix dirty so price/stock edits persist.
      product.markModified("sizes");
    }
    await product.save();
    await product.populate("category");
    await product.populate("subcategory");
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
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("subcategory")
      .populate("parentProduct");
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    const parentRef = product.parentProduct;
    const parentId = parentRef ? (parentRef._id || parentRef) : null;
    const root = parentId
      ? await Product.findById(parentId).populate("category").populate("subcategory")
      : product;
    if (!root) {
      return res.status(404).json({ message: "Product not found" });
    }

    const children = await Product.find({ parentProduct: root._id })
      .populate("category")
      .populate("subcategory")
      .sort({ color: 1, name: 1 });

    const colorVariants = children.map((c) => sizesForResponse(c));
    const base = sizesForResponse(product);
    const rootPlain = sizesForResponse(root);

    const allPrices = [];
    for (const v of [rootPlain, ...colorVariants]) {
      if (v.price != null) allPrices.push(v.price);
      if (v.sizes && v.sizes.length) {
        for (const s of v.sizes) {
          if (s.price != null) allPrices.push(s.price);
        }
      }
    }
    const valid = allPrices.filter((n) => n != null && !Number.isNaN(n));
    const priceMin = valid.length ? Math.min(...valid) : base.price;
    const priceMax = valid.length ? Math.max(...valid) : base.price;

    return res.status(200).json({
      message: "Product fetched successfully",
      data: {
        ...base,
        root: rootPlain,
        listingRootId: String(root._id),
        isVariant: !!parentId,
        colorVariants,
        variantCount: colorVariants.length,
        priceMin,
        priceMax,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const group = req.query.groupVariants === "1" || req.query.groupVariants === "true";
    const rootOnly = rootProductFilter();
    const q = group
      ? { category: req.params.categoryId, ...rootOnly }
      : { category: req.params.categoryId };
    const products = await Product.find(q).populate("category").populate("subcategory").populate("parentProduct");
    if (products.length === 0) {
      return res.status(404).json({
        message: "Products not found for this category",
      });
    }
    if (group) {
      const data = await Promise.all(products.map((p) => enrichStoreProductRow(p)));
      return res.status(200).json({
        message: "Products fetched successfully",
        data,
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

exports.getProductsBySubcategory = async (req, res) => {
  try {
    const group = req.query.groupVariants === "1" || req.query.groupVariants === "true";
    const rootOnly = rootProductFilter();
    const q = group
      ? { subcategory: req.params.subcategoryId, ...rootOnly }
      : { subcategory: req.params.subcategoryId };
    const products = await Product.find(q).populate("category").populate("subcategory").populate("parentProduct");
    if (products.length === 0) {
      return res.status(404).json({
        message: "Products not found for this subcategory",
      });
    }
    if (group) {
      const data = await Promise.all(products.map((p) => enrichStoreProductRow(p)));
      return res.status(200).json({
        message: "Products fetched successfully",
        data,
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