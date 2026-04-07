// routes/users.js
const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getProfile, updateProfile, followUser,
  getLikedPosts, getRepostedPosts
} = require("../controllers/userController");

router.get("/:id", protect, getProfile);
router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.put("/:id/follow", protect, followUser);
router.get("/:id/liked", protect, getLikedPosts);
router.get("/:id/reposts", protect, getRepostedPosts);
module.exports = router;