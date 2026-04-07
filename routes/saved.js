// routes/saved.js
const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getSaved, toggleSave } = require("../controllers/savedController");

router.get("/", protect, getSaved);
router.put("/:postId", protect, toggleSave);
module.exports = router;