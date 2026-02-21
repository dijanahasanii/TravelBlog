// routes/comments.js
const express = require("express");
const router = express.Router();
const { addComment, getCommentsForPost } = require("../controllers/commentController");
const auth = require("../middleware/auth");

router.post("/", auth, addComment);
router.get("/:postId", getCommentsForPost);

module.exports = router;
