// routes/analytics.js
const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getMyAnalytics } = require("../controllers/analyticsController");

router.get("/me", protect, getMyAnalytics);
module.exports = router;