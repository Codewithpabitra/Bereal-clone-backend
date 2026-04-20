const User = require("../models/User");
const Post = require("../models/Post");
const createNotification = require("../utils/createNotification");


// GET /api/users/:id
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, ...(avatar && { avatar }) },
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/users/:id/follow
exports.followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "Cannot follow yourself" });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    const isFollowing = target.followers.includes(req.user._id);

    if (isFollowing) {
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
    } else {
      await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });

       await createNotification({
        recipient: req.params.id,
        sender: req.user._id,
        type: "follow",
        post: null,
        message: `${req.user.name} started following you`,
      });
    }

    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/:id/liked
exports.getLikedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: "likedPosts",
      populate: { path: "user", select: "name avatar" },
    });
    res.json(user.likedPosts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/:id/reposts
exports.getRepostedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: "repostedPosts",
      populate: { path: "user", select: "name avatar" },
    });
    res.json(user.repostedPosts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/search?q=john
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const users = await User.find({
      name: { $regex: query, $options: "i" },
      _id: { $ne: req.user._id }, // exclude self
    })
      .select("name avatar bio followers")
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};