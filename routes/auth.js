const router = require("express").Router();
const {
  register,
  login,
  getMe,
  changePassword,
  deleteAccount,
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;