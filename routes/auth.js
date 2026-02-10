const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const { register, login, forgotPassword, resetPassword, getMe, users, deleteUser, updateUser } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", verifyToken, getMe);
router.get("/users", users);
router.delete("/users/:id", verifyToken, deleteUser);
router.put("/users/:id",verifyToken, updateUser);
module.exports = router;
