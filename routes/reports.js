const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  reportPost,
  reportUser,
  toggleBlock,
  getBlockedUsers,
} = require("../controllers/reportController");

router.post("/post/:postId", protect, reportPost);
router.post("/user/:userId", protect, reportUser);
router.put("/block/:userId", protect, toggleBlock);
router.get("/blocked", protect, getBlockedUsers);

module.exports = router;