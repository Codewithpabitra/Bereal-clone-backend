const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getProfile,
  updateProfile,
  followUser,
  getLikedPosts,
  getRepostedPosts,
  searchUsers,
} = require("../controllers/userController");

// ✅ Static routes FIRST — before any /:id routes
router.get("/search", protect, searchUsers);
router.put("/profile", protect, upload.single("avatar"), updateProfile);

// ✅ Dynamic :id routes AFTER
router.get("/:id", protect, getProfile);
router.put("/:id/follow", protect, followUser);
router.get("/:id/liked", protect, getLikedPosts);
router.get("/:id/reposts", protect, getRepostedPosts);
router.get("/:id/posts", protect, require("../controllers/userController").getUserPosts);

module.exports = router;