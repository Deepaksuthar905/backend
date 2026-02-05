const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
// const { verifyToken } = require("../middlewares/auth"); // Commented out - authentication disabled
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  uploadPaymentScreenshot,
} = require("../controllers/orderController");

const uploadDir = path.join(__dirname, "../uploads/screenshots");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + ext);
  },
});
// Accept common field names: screenshot, file, image
const uploadScreenshot = multer({ storage }).fields([
  { name: "screenshot", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// All order routes require authentication
// router.post("/create", verifyToken, createOrder);
router.post("/upload-screenshot", uploadScreenshot, uploadPaymentScreenshot);
router.post("/create", createOrder);
// router.get("/", verifyToken, getUserOrders);
router.get("/", getUserOrders);
// router.get("/all", verifyToken, getAllOrders); // Admin only
router.get("/all", getAllOrders); // Admin only
// router.get("/:id", verifyToken, getOrder);
router.get("/:id", getOrder);
// router.put("/:id/status", verifyToken, updateOrderStatus); // Admin only
router.put("/:id/status", updateOrderStatus); // Admin only

module.exports = router;
