const Analytics = require("../models/Analytics");
const Post = require("../models/Post");
const User = require("../models/User");

exports.getMyAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id).select("memberSince");
    const totalPosts = await Post.countDocuments({ user: req.user._id });

    res.json({
      memberSince: user.memberSince,
      totalPosts,
      totalLikes: analytics?.totalLikes || 0,
      totalReposts: analytics?.totalReposts || 0,
      totalShares: analytics?.totalShares || 0,
      dailyPosts: analytics?.dailyPosts || [],
      monthlyPosts: analytics?.monthlyPosts || [],
      yearlyPosts: analytics?.yearlyPosts || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};