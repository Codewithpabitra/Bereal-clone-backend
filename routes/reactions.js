const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getReactions, toggleReaction } = require("../controllers/reactionController");

router.get("/:postId", protect, getReactions);
router.put("/:postId", protect, toggleReaction);

module.exports = router;