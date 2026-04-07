// routes/posts.js
const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getFeed, createPost, deletePost,
  likePost, repostPost, sharePost
} = require("../controllers/postController");

router.get("/feed", protect, getFeed);
router.post("/", protect, upload.single("image"), createPost);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, likePost);
router.put("/:id/repost", protect, repostPost);
router.put("/:id/share", protect, sharePost);
module.exports = router;