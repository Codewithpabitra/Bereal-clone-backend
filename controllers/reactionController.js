const Reaction = require("../models/Reaction");
const createNotification = require("../utils/createNotification");
const Post = require("../models/Post");

// GET /api/reactions/:postId
exports.getReactions = async (req, res) => {
  try {
    const reactions = await Reaction.find({ post: req.params.postId }).populate(
      "user",
      "name avatar",
    );

    // Group by emoji
    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = [];
      acc[r.emoji].push(r.user);
      return acc;
    }, {});

    res.json({ grouped, total: reactions.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/reactions/:postId
exports.toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const validEmojis = ["❤️", "😂", "🔥", "😮", "😢", "👏"];
    if (!validEmojis.includes(emoji)) {
      return res.status(400).json({ message: "Invalid emoji" });
    }

    const existing = await Reaction.findOne({
      post: req.params.postId,
      user: req.user._id,
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji — remove it (toggle off)
        await existing.deleteOne();
        return res.json({ action: "removed", emoji });
      } else {
        // Different emoji — update it
        existing.emoji = emoji;
        await existing.save();
        return res.json({ action: "updated", emoji });
      }
    }

    // New reaction
    await Reaction.create({
      post: req.params.postId,
      user: req.user._id,
      emoji,
    });

    // Notify post owner
    const post = await Post.findById(req.params.postId);
    if (post) {
      await createNotification(req.app, {
        recipient: post.user,
        sender: req.user._id,
        type: "like",
        post: post._id,
        message: `${req.user.name} reacted ${emoji} to your post`,
      });
    }

    res.json({ action: "added", emoji });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
