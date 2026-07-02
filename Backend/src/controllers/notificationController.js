const notificationService = require('../service/notificationService');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const Enrollment = require('../models/Enrollment');

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
    const filters = {};
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (req.query.role) filters.role = req.query.role;
    
    const notifications = await notificationService.listAll(limit, skip, filters);
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

const sendClassNotification = async (req, res) => {
  try {
    const classItem = await ClassModel.findOne({ _id: req.params.classId, teacher: req.user._id });
    if (!classItem) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const enrollments = await Enrollment.find({
      class: req.params.classId,
      status: { $ne: 'CANCELLED' }
    }).populate('user', '_id status');

    const users = enrollments
      .map((enrollment) => enrollment.user)
      .filter((user) => user && user.status !== 'INACTIVE');

    const notifications = await notificationService.broadcastNotification(
      users,
      req.body.title,
      req.body.message,
      {
        type: req.body.type || 'CLASS',
        classId: classItem._id,
        createdBy: req.user._id
      }
    );

    return res.status(201).json({ message: 'Class notification sent', count: notifications.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Cannot send class notification' });
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

module.exports = { broadcastNotification, listAllNotifications, listNotifications, markRead, sendClassNotification };
