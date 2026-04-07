const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalReposts: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    dailyPosts: [
      {
        date: { type: String }, // "2024-01-15"
        count: { type: Number, default: 0 },
      },
    ],
    monthlyPosts: [
      {
        month: { type: String }, // "2024-01"
        count: { type: Number, default: 0 },
      },
    ],
    yearlyPosts: [
      {
        year: { type: String }, // "2024"
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);