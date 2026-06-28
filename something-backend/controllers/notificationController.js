const notifRepo = require('../repositories/notificationRepository');

const getNotifications = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const notifications = await notifRepo.getUserNotifications(req.user.id, +limit, +offset);
    const unreadCount = await notifRepo.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    await notifRepo.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await notifRepo.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

module.exports = { getNotifications, markRead, markAllRead };