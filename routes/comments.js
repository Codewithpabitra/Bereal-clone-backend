// routes/comments.js
const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getComments, addComment, deleteComment } = require("../controllers/commentController");

router.get("/:postId", protect, getComments);
router.post("/:postId", protect, addComment);
router.delete("/:id", protect, deleteComment);
module.exports = router;