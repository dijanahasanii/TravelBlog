const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { getUserById, updateUser } = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/:userId", getUserById);
router.patch("/:id", verifyToken, updateUser);

module.exports = router;

