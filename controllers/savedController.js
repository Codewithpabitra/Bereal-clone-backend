const SavedPost = require("../models/SavedPost");

exports.getSaved = async (req, res) => {
  try {
    const saved = await SavedPost.find({ user: req.user._id })
      .populate({
        path: "post",
        populate: { path: "user", select: "name avatar" },
      })
      .sort({ createdAt: -1 });

    const validPosts = saved
      .map((s) => s.post)
      .filter((post) => post !== null);

    res.json(validPosts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleSave = async (req, res) => {
  try {
    const existing = await SavedPost.findOne({
      user: req.user._id,
      post: req.params.postId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ saved: false });
    }

    await SavedPost.create({ user: req.user._id, post: req.params.postId });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};