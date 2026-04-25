const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getFeed,
  createPost,
  deletePost,
  likePost,
  repostPost,
  sharePost,
  getArchive,
  getExplore,
} = require("../controllers/postController");

// ✅ Static routes FIRST
router.get("/feed", protect, getFeed);
router.get("/archive", protect, getArchive);
router.get("/explore", protect, getExplore);
router.post("/", protect, upload.single("image"), createPost);

// ✅ Dynamic :id routes LAST
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, likePost);
router.put("/:id/repost", protect, repostPost);
router.put("/:id/share", protect, sharePost);

module.exports = router;