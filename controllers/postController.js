const Post = require("../models/Post");
const User = require("../models/User");
const Analytics = require("../models/Analytics");

// GET /api/posts/feed
exports.getFeed = async (req, res) => {
  try {
    const now = new Date();
    const posts = await Post.find({ expiresAt: { $gt: now } })
      .populate("user", "name avatar")
      .populate("originalPost")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/posts
exports.createPost = async (req, res) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    if (!image) return res.status(400).json({ message: "Image is required" });

    const post = await Post.create({
      user: req.user._id,
      image,
      caption: req.body.caption || "",
    });

    // Update analytics
    const today = new Date().toISOString().split("T")[0];
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    await Analytics.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { totalPosts: 1 },
        $inc: { "dailyPosts.$[d].count": 1 },
      },
      {
        arrayFilters: [{ "d.date": today }],
        upsert: true,
      }
    );

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/posts/:id/like
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: post._id } });
    } else {
      post.likes.push(userId);
      await User.findByIdAndUpdate(userId, { $addToSet: { likedPosts: post._id } });
    }

    await post.save();
    res.json({ liked: !isLiked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/posts/:id/repost
exports.repostPost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const isReposted = originalPost.reposts.includes(userId);

    if (isReposted) {
      originalPost.reposts = originalPost.reposts.filter(
        (id) => id.toString() !== userId.toString()
      );
      await User.findByIdAndUpdate(userId, { $pull: { repostedPosts: originalPost._id } });
      await Post.findOneAndDelete({ user: userId, originalPost: originalPost._id, isRepost: true });
    } else {
      originalPost.reposts.push(userId);
      await User.findByIdAndUpdate(userId, { $addToSet: { repostedPosts: originalPost._id } });
      await Post.create({
        user: userId,
        image: originalPost.image,
        caption: originalPost.caption,
        isRepost: true,
        originalPost: originalPost._id,
      });
    }

    await originalPost.save();
    res.json({ reposted: !isReposted, repostCount: originalPost.reposts.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/posts/:id/share
exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.shareCount += 1;
    await post.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { sharedPosts: post._id } });

    res.json({ shareCount: post.shareCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/posts/explore
exports.getExplore = async (req, res) => {
  try {
    const now = new Date();
    const posts = await Post.find({ expiresAt: { $gt: now } })
      .populate("user", "name avatar")
      .sort({ likes: -1, createdAt: -1 }) // most liked first
      .limit(50);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};