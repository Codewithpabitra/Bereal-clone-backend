const Post = require("../models/Post");
const User = require("../models/User");
const Analytics = require("../models/Analytics");
const createNotification = require("../utils/createNotification");

// GET /api/posts/feed
exports.getFeed = async (req, res) => {
  try {
    const now = new Date();
    const currentUser = await User.findById(req.user._id);
    const blockedUsers = currentUser.blockedUsers || [];

    const posts = await Post.find({
      expiresAt: { $gt: now },
      user: { $nin: blockedUsers }, // exclude blocked users' posts
    })
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
    //Cloudinary gives full URL in req.file.path
    const image = req.file ? req.file.path : null;
    if (!image) return res.status(400).json({ message: "Image is required" });

    const caption = req.body.caption || "";
    const hashtags = caption
      .match(/#[a-zA-Z0-9_]+/g)
      ?.map((tag) => tag.toLowerCase()) || [];

    const post = await Post.create({
      user: req.user._id,
      image,  //full Cloudinary URL like https://res.cloudinary.com/...
      caption,
      hashtags,
    });

    // Streak logic
    const today = new Date().toISOString().split("T")[0];
    const user = await User.findById(req.user._id);
    const last = user.lastPostedDate;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = user.currentStreak;
    if (last === today) {
      // already posted today
    } else if (last === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    await User.findByIdAndUpdate(req.user._id, {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastPostedDate: today,
    });

    // Analytics
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);
    const analytics = await Analytics.findOne({ user: req.user._id });
    if (analytics) {
      // daily 
      const dayEntry = analytics.dailyPosts.find((d) => d.date === today);
      if (dayEntry) dayEntry.count += 1;
      else analytics.dailyPosts.push({ date: today, count: 1 });

      // monthly 
      const monthEntry = analytics.monthlyPosts.find((m) => m.month === month);
      if (monthEntry) monthEntry.count += 1;
      else analytics.monthlyPosts.push({ month, count: 1 });

      // yearly 
      const yearEntry = analytics.yearlyPosts.find((y) => y.year === year);
      if (yearEntry) yearEntry.count += 1;
      else analytics.yearlyPosts.push({ year, count: 1 });

      analytics.totalPosts += 1;
      await analytics.save();
    }

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
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString(),
      );
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: post._id } });
    } else {
      post.likes.push(userId);
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedPosts: post._id },
      });
    }

    await post.save();

    if (!isLiked) {
      await createNotification({
        recipient: post.user,
        sender: req.user._id,
        type: "like",
        post: post._id,
        message: `${req.user.name} liked your post`,
      });
    }
    res.json({ liked: !isLiked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/posts/:id/repost
exports.repostPost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost)
      return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const isReposted = originalPost.reposts.includes(userId);

    if (isReposted) {
      originalPost.reposts = originalPost.reposts.filter(
        (id) => id.toString() !== userId.toString(),
      );
      await User.findByIdAndUpdate(userId, {
        $pull: { repostedPosts: originalPost._id },
      });
      await Post.findOneAndDelete({
        user: userId,
        originalPost: originalPost._id,
        isRepost: true,
      });
    } else {
      originalPost.reposts.push(userId);
      await User.findByIdAndUpdate(userId, {
        $addToSet: { repostedPosts: originalPost._id },
      });
      await Post.create({
        user: userId,
        image: originalPost.image,
        caption: originalPost.caption,
        isRepost: true,
        originalPost: originalPost._id,
      });
    }

    await originalPost.save();
    if (!isReposted) {
      await createNotification({
        recipient: originalPost.user,
        sender: req.user._id,
        type: "repost",
        post: originalPost._id,
        message: `${req.user.name} reposted your post`,
      });
    }

    res.json({
      reposted: !isReposted,
      repostCount: originalPost.reposts.length,
    });
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
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { sharedPosts: post._id },
    });

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


// GET /api/posts/archive — my expired posts
exports.getArchive = async (req, res) => {
  try {
    const now = new Date();
    const posts = await Post.find({
      user: req.user._id,
      expiresAt: { $lt: now }, // expired posts only
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// get posts on searching hashtags
// GET /api/posts/hashtag/:tag
exports.getPostsByHashtag = async (req, res) => {
  try {
    const tag = `#${req.params.tag.toLowerCase()}`;
    const now = new Date();

    const posts = await Post.find({
      hashtags: tag,
      expiresAt: { $gt: now }, // only active posts
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ tag, posts, count: posts.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// get all the trending hashtags
// GET /api/posts/trending-hashtags
exports.getTrendingHashtags = async (req, res) => {
  try {
    const now = new Date();
    const posts = await Post.find({ expiresAt: { $gt: now } })
      .select("hashtags");

    // Count hashtag frequency
    const counts = {};
    posts.forEach((post) => {
      post.hashtags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    // Sort by frequency
    const trending = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json(trending);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};