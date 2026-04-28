const Comment = require("../models/Comment");
const createNotification = require("../utils/createNotification");

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user._id,
      text,
    });

    const post = await require("../models/Post").findById(req.params.postId);
    if (post) {
      await createNotification(req.app, {
        recipient: post.user,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.name} commented on your post`,
      });
    }

    const populated = await comment.populate("user", "name avatar");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
