const Notification = require('../models/Notification');
const { getIo } = require('../utils/socket');

const toRealtimePayload = (notification, fallback = {}) => ({
  _id: notification._id,
  id: notification._id,
  title: notification.title || fallback.title,
  message: notification.message || fallback.message,
  meta: notification.meta || fallback.meta || {},
  read: Boolean(notification.read),
  createdAt: notification.createdAt || new Date()
});

const emitRealtimeNotification = (io, userId, payload) => {
  io.to(`user:${userId}`).emit('notification', payload);
  io.to(`user:${userId}`).emit('new-notification', payload);
};

const createNotification = async (userId, title, message, meta = {}) => {
  const n = await Notification.create({ user: userId, title, message, meta });
  try {
    const io = getIo();
    if (io) {
      emitRealtimeNotification(io, userId, toRealtimePayload(n, { title, message, meta }));
    }
  } catch (err) {
    console.error('Failed to emit notification', err);
  }
  return n;
};

const listForUser = async (userId, limit = 50, skip = 0) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

const listAll = async (limit = 100, skip = 0) => {
  return Notification.find({})
    .populate('user', 'fullName email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const broadcastNotification = async (users = [], title, message, meta = {}) => {
  const payloads = users.map((user) => ({
    user: user._id,
    title,
    message,
    meta
  }));

  if (!payloads.length) return [];

  const notifications = await Notification.insertMany(payloads);
  try {
    const io = getIo();
    if (io) {
      notifications.forEach((notification) => {
        emitRealtimeNotification(io, notification.user, toRealtimePayload(notification, { title, message, meta }));
      });
    }
  } catch (err) {
    console.error('Failed to emit broadcast notifications', err);
  }
  return notifications;
};

const markRead = async (id, userId) => {
  return Notification.findOneAndUpdate({ _id: id, user: userId }, { read: true }, { new: true });
};

module.exports = { broadcastNotification, createNotification, listAll, listForUser, markRead };
