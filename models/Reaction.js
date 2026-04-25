const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      enum: ["❤️", "😂", "🔥", "😮", "😢", "👏"],
      required: true,
    },
  },
  { timestamps: true }
);

// One reaction per user per post
reactionSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Reaction", reactionSchema);