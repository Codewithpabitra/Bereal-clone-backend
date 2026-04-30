const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { uploadPost } = require("../middleware/uploadMiddleware");
const {
  getFeed,
  createPost,
  deletePost,
  likePost,
  repostPost,
  sharePost,
  getArchive,
  getExplore,
  getPostsByHashtag,
  getTrendingHashtags,
  getLeaderboard,
  getMemories
} = require("../controllers/postController");

// ✅ Static routes FIRST
router.get("/feed", protect, getFeed);
router.get("/archive", protect, getArchive);
router.get("/explore", protect, getExplore);
router.get("/hashtag/:tag", protect, getPostsByHashtag);
router.get("/trending-hashtags", protect, getTrendingHashtags);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/memories", protect, getMemories);

router.post("/", protect, uploadPost.single("image"), createPost);

// ✅ Dynamic :id routes LAST
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, likePost);
router.put("/:id/repost", protect, repostPost);
router.put("/:id/share", protect, sharePost);

module.exports = router;