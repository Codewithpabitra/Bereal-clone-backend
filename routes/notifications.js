const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/read-all", protect, markAllRead);
router.put("/:id/read", protect, markOneRead);

module.exports = router;