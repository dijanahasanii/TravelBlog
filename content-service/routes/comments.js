// routes/comments.js
const express = require("express");
const router = express.Router();
const { addComment } = require("../controllers/commentController");
const auth = require("../middleware/auth");

router.post("/", auth, addComment);

module.exports = router;
