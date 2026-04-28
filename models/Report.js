const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["post", "user"],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "inappropriate",
        "harassment",
        "hate_speech",
        "violence",
        "fake_account",
        "other",
      ],
      required: true,
    },
    details: {
      type: String,
      default: "",
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// One report per user per post/user
reportSchema.index({ reporter: 1, post: 1 }, { sparse: true });
reportSchema.index({ reporter: 1, reportedUser: 1 }, { sparse: true });

module.exports = mongoose.model("Report", reportSchema);