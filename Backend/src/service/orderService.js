const courseRepository = require('../repositories/courseRepository');
const classRepository = require('../repositories/classRepository');
const orderRepository = require('../repositories/orderRepository');
const enrollmentService = require('./enrollmentService');
const orderDto = require('../dtos/orderDto');
const notificationService = require('./notificationService');

const ORDER_PAYMENT_TIMEOUT_MINUTES = Number(process.env.ORDER_PAYMENT_TIMEOUT_MINUTES) || 30;

const buildOrderExpiresAt = () => {
  return new Date(Date.now() + ORDER_PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
};

const createOrder = async ({ userId, courseId, currency = 'VND', paymentMethod = 'VNPAY' }) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new Error('COURSE_NOT_FOUND');

  const order = await orderRepository.create({
    user: userId,
    course: courseId,
    amount: course.price,
    currency,
    paymentMethod,
    status: 'PENDING',
    expiresAt: buildOrderExpiresAt()
  });

  await order.populate('course', 'title price');
  return orderDto.toOrderResponse(order);
};

const markOrderFailed = async (orderId, providerData = {}) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');

  order.status = 'FAILED';
  order.providerData = providerData;
  order.transactionRef = providerData.transactionRef || order.transactionRef;

  await order.save();
  return orderDto.toOrderResponse(order);
};

const markOrderPaid = async (orderId, providerData = {}) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.status === 'PAID') return orderDto.toOrderResponse(order);
  if (order.status === 'CANCELLED') throw new Error('ORDER_CANCELLED');
  if (order.expiresAt && order.expiresAt <= new Date()) {
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancelReason = 'PAYMENT_TIMEOUT';
    order.providerData = providerData;
    await order.save();
    throw new Error('ORDER_EXPIRED');
  }

  order.status = 'PAID';
  order.providerData = providerData;
  order.transactionRef = providerData.transactionRef || order.transactionRef;

  const existingEnrollment = await enrollmentService.getExistingEnrollment(order.user, order.course);
  if (existingEnrollment) {
    if (existingEnrollment.class) {
      order.class = existingEnrollment.class;
    }
    await order.save();
    return orderDto.toOrderResponse(order);
  }

  const targetClass = await assignClassForPaidOrder(order.course);
  if (targetClass) {
    order.class = targetClass._id;
  }

  await order.save();

  await enrollmentService.createEnrollment({
    user: order.user,
    course: order.course,
    class: targetClass ? targetClass._id : null,
    status: targetClass ? 'ASSIGNED_CLASS' : 'WAITING_CLASS'
  });

  return orderDto.toOrderResponse(order);
};

const isClassJoinable = (classItem) => {
  const now = new Date();

  if (classItem.startDate > now) {
    return true;
  }

  const start = new Date(classItem.startDate).getTime();
  const end = new Date(classItem.endDate).getTime();
  const current = now.getTime();

  if (current >= end) {
    return false;
  }

  const learnedRatio = (current - start) / (end - start);

  return learnedRatio < 0.2;
};

const assignClassForPaidOrder = async (courseId) => {
  const classes = await classRepository.findJoinablePaidClasses(courseId);
  const targetClass = classes.find(isClassJoinable);

  if (!targetClass) return null;

  targetClass.currentStudents += 1;
  await targetClass.save();

  return targetClass;
};

const getOrdersForUser = async (userId) => {
  const orders = await orderRepository.findByUserWithDetails(userId);
  return orders.map(orderDto.toOrderResponse);
};

const getOrderById = async (orderId) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  return orderDto.toOrderResponse(order);
};

const buildOrderFilter = (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.course) query.course = filters.course;
  if (filters.user) query.user = filters.user;

  const createdAt = {};
  if (filters.from) createdAt.$gte = new Date(filters.from);
  if (filters.to) createdAt.$lte = new Date(filters.to);
  if (Object.keys(createdAt).length) query.createdAt = createdAt;

  return query;
};

const getOrders = async (filters = {}) => {
  const orders = await orderRepository.findAllWithDetails(buildOrderFilter(filters));
  return orders.map(orderDto.toOrderResponse);
};

const cancelExpiredPendingOrders = async () => {
  const now = new Date();
  const expiredOrders = await orderRepository.findExpiredPending(now);
  if (!expiredOrders.length) return [];

  await orderRepository.cancelExpiredPending(expiredOrders.map((order) => order._id), now);

  await Promise.all(expiredOrders.map((order) => notificationService.createNotification(
    order.user,
    'Order cancelled',
    `Your order for ${order.course?.title || 'a course'} was cancelled because payment was not completed within ${ORDER_PAYMENT_TIMEOUT_MINUTES} minutes.`,
    {
      orderId: order._id,
      courseId: order.course?._id || order.course,
      reason: 'PAYMENT_TIMEOUT'
    }
  ).catch((error) => {
    console.error('Failed to notify expired order', error);
  })));

  return expiredOrders.map(orderDto.toOrderResponse);
};

module.exports = {
  createOrder,
  markOrderPaid,
  markOrderFailed,
  getOrdersForUser,
  getOrderById,
  getOrders,
  cancelExpiredPendingOrders
};
