const Notification = require('../models/Notification');

/**
 * Send a notification
 * @param {Object} io - Socket.io instance
 * @param {string} userId - User ID to receive the notification
 * @param {string} type - Notification type (enum from model)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} link - URL link to redirect to
 * @param {Object} metadata - Optional extra data
 */
const sendNotification = async (io, userId, type, title, message, link = '', metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      metadata,
    });

    if (io) {
      io.to(userId.toString()).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendNotification };
