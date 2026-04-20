const Notification = require("../models/Notification");

const createNotification = async ({ recipient, sender, type, post, message }) => {
  try {
    // Don't notify yourself
    if (recipient.toString() === sender.toString()) return;

    await Notification.create({ recipient, sender, type, post, message });
  } catch (err) {
    console.error("Notification error:", err);
  }
};

module.exports = createNotification;