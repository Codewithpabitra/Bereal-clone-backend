const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String, required: true },
    caption: { type: String, default: "" },
    hashtags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareCount: { type: Number, default: 0 },
    isRepost: { type: Boolean, default: false },
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hrs from now
    },
    isExpired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);