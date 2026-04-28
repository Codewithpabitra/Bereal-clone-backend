const Report = require("../models/Report");
const User = require("../models/User");
const Post = require("../models/Post");

// POST /api/reports/post/:postId
exports.reportPost = async (req, res) => {
  try {
    const { reason, details } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Can't report your own post
    if (post.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot report your own post" });
    }

    // Check already reported
    const existing = await Report.findOne({
      reporter: req.user._id,
      post: req.params.postId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already reported this post" });
    }

    await Report.create({
      reporter: req.user._id,
      type: "post",
      post: req.params.postId,
      reason,
      details: details || "",
    });

    res.json({ message: "Post reported successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/reports/user/:userId
exports.reportUser = async (req, res) => {
  try {
    const { reason, details } = req.body;

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot report yourself" });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const existing = await Report.findOne({
      reporter: req.user._id,
      reportedUser: req.params.userId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already reported this user" });
    }

    await Report.create({
      reporter: req.user._id,
      type: "user",
      reportedUser: req.params.userId,
      reason,
      details: details || "",
    });

    res.json({ message: "User reported successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/reports/block/:userId
exports.toggleBlock = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    const currentUser = await User.findById(req.user._id);
    const isBlocked = currentUser.blockedUsers
      .map((id) => id.toString())
      .includes(req.params.userId);

    if (isBlocked) {
      // Unblock
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { blockedUsers: req.params.userId },
      });
      return res.json({ blocked: false, message: "User unblocked" });
    }

    // Block — also unfollow both ways
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: req.params.userId },
      $pull: { following: req.params.userId },
    });
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { followers: req.user._id },
    });

    return res.json({ blocked: true, message: "User blocked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/reports/blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "name avatar"
    );
    res.json(user.blockedUsers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};