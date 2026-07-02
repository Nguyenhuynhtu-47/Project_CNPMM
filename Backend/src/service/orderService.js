const courseRepository = require('../repositories/courseRepository');
const classRepository = require('../repositories/classRepository');
const orderRepository = require('../repositories/orderRepository');
const enrollmentService = require('./enrollmentService');
const orderDto = require('../dtos/orderDto');
const notificationService = require('./notificationService');
const couponService = require('./couponService');
const loyaltyService = require('./loyaltyService');

const ORDER_PAYMENT_TIMEOUT_MINUTES = Number(process.env.ORDER_PAYMENT_TIMEOUT_MINUTES) || 30;

const buildOrderExpiresAt = () => {
  return new Date(Date.now() + ORDER_PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
};

const createOrder = async ({ userId, courseId, currency = 'VND', paymentMethod = 'VNPAY', couponCode = '', pointsToUse = 0 }) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new Error('COURSE_NOT_FOUND');

  const unfinishedEnrollment = await enrollmentService.getUnfinishedEnrollment(userId, courseId);
  if (unfinishedEnrollment) throw new Error('COURSE_ALREADY_ENROLLED');

  const subtotal = Number(course.price || 0);
  const couponResult = await couponService.validateCoupon({ code: couponCode, userId, subtotal });
  const afterCouponAmount = Math.max(subtotal - couponResult.discount, 0);

  const order = await orderRepository.create({
    user: userId,
    course: courseId,
    subtotal,
    amount: afterCouponAmount,
    currency,
    paymentMethod,
    coupon: couponResult.coupon?._id,
    couponCode: couponResult.coupon?.code || '',
    couponDiscount: couponResult.discount,
    status: 'PENDING',
    expiresAt: buildOrderExpiresAt()
  });

  const pointResult = await loyaltyService.spendPoints({
    userId,
    requestedPoints: pointsToUse,
    maxAmount: order.amount,
    orderId: order._id
  });
  if (pointResult.points > 0) {
    order.pointsRedeemed = pointResult.points;
    order.pointsDiscount = pointResult.discount;
    order.amount = Math.max(order.amount - pointResult.discount, 0);
    await order.save();
  }

  await order.populate('course', 'title price');
  return orderDto.toOrderResponse(order);
};

const previewOrder = async ({ userId, courseId, couponCode = '', pointsToUse = 0 }) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new Error('COURSE_NOT_FOUND');

  const unfinishedEnrollment = await enrollmentService.getUnfinishedEnrollment(userId, courseId);
  if (unfinishedEnrollment) throw new Error('COURSE_ALREADY_ENROLLED');

  const subtotal = Number(course.price || 0);
  const couponResult = await couponService.validateCoupon({ code: couponCode, userId, subtotal });
  const afterCouponAmount = Math.max(subtotal - couponResult.discount, 0);
  const pointResult = await loyaltyService.previewSpendPoints({
    userId,
    requestedPoints: pointsToUse,
    maxAmount: afterCouponAmount
  });
  const amount = Math.max(afterCouponAmount - pointResult.discount, 0);

  return {
    course: {
      _id: course._id,
      title: course.title,
      price: course.price,
      imageUrl: course.imageUrl,
      category: course.category
    },
    subtotal,
    coupon: couponResult.coupon
      ? {
        _id: couponResult.coupon._id,
        code: couponResult.coupon.code,
        name: couponResult.coupon.name,
        discountType: couponResult.coupon.discountType,
        discountValue: couponResult.coupon.discountValue
      }
      : null,
    couponCode: couponResult.coupon?.code || '',
    couponDiscount: couponResult.discount,
    pointsBalance: pointResult.balance,
    requestedPoints: Number(pointsToUse || 0),
    pointsRedeemed: pointResult.points,
    pointsDiscount: pointResult.discount,
    amount,
    currency: 'VND',
    freeCheckout: amount <= 0
  };
};

const markOrderFailed = async (orderId, providerData = {}) => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');

  order.status = 'FAILED';
  order.providerData = providerData;
  order.transactionRef = providerData.transactionRef || order.transactionRef;

  await order.save();
  await loyaltyService.refundSpentPoints({ order });
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
    await loyaltyService.refundSpentPoints({ order });
    throw new Error('ORDER_EXPIRED');
  }

  order.status = 'PAID';
  order.providerData = providerData;
  order.transactionRef = providerData.transactionRef || order.transactionRef;
  if (order.coupon && !order.couponUsageCounted) {
    await couponService.countCouponUsage(order.coupon);
    order.couponUsageCounted = true;
  }

  const existingEnrollment = await enrollmentService.getExistingEnrollment(order.user, order.course);
  if (existingEnrollment) {
    if (existingEnrollment.class) {
      order.class = existingEnrollment.class;
    }
    await order.save();
    await loyaltyService.awardOrderPoints({ order });
    return orderDto.toOrderResponse(order);
  }

  const targetClass = await assignClassForPaidOrder(order.course);
  if (targetClass) {
    order.class = targetClass._id;
  }

  await order.save();
  await loyaltyService.awardOrderPoints({ order });

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
  await Promise.all(expiredOrders.map((order) => {
    order.status = 'CANCELLED';
    order.cancelledAt = now;
    order.cancelReason = 'PAYMENT_TIMEOUT';
    return loyaltyService.refundSpentPoints({ order }).catch((error) => {
      console.error('Failed to refund points for expired order', error);
    });
  }));

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
  previewOrder,
  markOrderPaid,
  markOrderFailed,
  getOrdersForUser,
  getOrderById,
  getOrders,
  cancelExpiredPendingOrders
};


