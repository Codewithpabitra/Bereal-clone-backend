const Notification = require("../models/Notification");

const createNotification = async (app, { recipient, sender, type, post, message }) => {
  try {
    if (recipient.toString() === sender.toString()) return;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      message,
    });

    // ✅ Populate sender for real-time delivery
    const populated = await notification.populate("sender", "name avatar");

    // ✅ Get io and emit to recipient's room
    const io = app.get("io");
    if (io) {
      io.to(`user:${recipient}`).emit("notification:new", populated);
    }

    return populated;
  } catch (err) {
    console.error("Notification error:", err);
  }
};

module.exports = createNotification;