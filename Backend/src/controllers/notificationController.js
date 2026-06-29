const notificationService = require('../service/notificationService');
const User = require('../models/User');

const listNotifications = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const notifications = await notificationService.listForUser(userId);
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Cannot load notifications' });
  }
};

const listAllNotifications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;
    const notifications = await notificationService.listAll(limit, skip);
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Cannot load notifications' });
  }
};

const broadcastNotification = async (req, res) => {
  try {
    const query = {};
    if (req.body.role) query.role = req.body.role;
    if (req.body.status) query.status = req.body.status;

    const users = await User.find(query).select('_id');
    const notifications = await notificationService.broadcastNotification(
      users,
      req.body.title,
      req.body.message,
      {
        type: req.body.type || 'SYSTEM',
        createdBy: req.user._id
      }
    );

    return res.status(201).json({ message: 'Notification broadcasted', count: notifications.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Cannot broadcast notification' });
  }
};

const markRead = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const id = req.params.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const n = await notificationService.markRead(id, userId);
    if (!n) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ notification: n });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Cannot mark read' });
  }
};

module.exports = { broadcastNotification, listAllNotifications, listNotifications, markRead };
