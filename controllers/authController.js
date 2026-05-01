const User = require("../models/User");
const Analytics = require("../models/Analytics");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const SavedPost = require("../models/SavedPost");
const Reaction = require("../models/Reaction");
const Report = require("../models/Report");


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    // Create analytics doc for new user
    await Analytics.create({ user: user._id });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check new password is different
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: "New password must be different" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user._id, { password: hashed });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/auth/delete-account
exports.deleteAccount = async (req, res) => {
  const { password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const userId = req.user._id;

    // Delete all user data in parallel
    await Promise.all([
      // Delete all posts
      Post.deleteMany({ user: userId }),

      // Delete all comments
      Comment.deleteMany({ user: userId }),

      // Delete all notifications (sent and received)
      Notification.deleteMany({
        $or: [{ recipient: userId }, { sender: userId }],
      }),

      // Delete all saved posts
      SavedPost.deleteMany({ user: userId }),

      // Delete analytics
      Analytics.deleteMany({ user: userId }),

      // Delete all reactions
      Reaction.deleteMany({ user: userId }),

      // Delete all reports
      Report.deleteMany({
        $or: [{ reporter: userId }, { reportedUser: userId }],
      }),

      // Remove from other users followers/following/blocked
      User.updateMany(
        {},
        {
          $pull: {
            followers: userId,
            following: userId,
            blockedUsers: userId,
            likedPosts: { $in: await Post.find({ user: userId }).distinct("_id") },
          },
        }
      ),
    ]);

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};