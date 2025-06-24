const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { getUserById, updateUser } = require("../controllers/userController");

router.post("/register", register);
router.post("/login", login);
router.get("/:userId", getUserById);
router.patch("/:id", updateUser);

module.exports = router;

