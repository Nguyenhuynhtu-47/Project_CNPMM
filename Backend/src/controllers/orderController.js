const orderService = require('../service/orderService');

const createOrder = async (req, res) => {
  try {
    const { courseId, couponCode, pointsToUse } = req.body;
    const order = await orderService.createOrder({
      userId: req.user._id,
      courseId,
      couponCode,
      pointsToUse
    });

    return res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error(error);
    if (error.message === 'COURSE_NOT_FOUND') {
      return res.status(404).json({ message: 'Course not found' });
    }
    const couponErrors = {
      COUPON_NOT_FOUND: 'Coupon not found',
      COUPON_INACTIVE: 'Coupon is inactive or expired',
      COUPON_USAGE_LIMIT: 'Coupon usage limit reached',
      COUPON_USER_LIMIT: 'You already used this coupon',
      COUPON_MIN_ORDER: 'Order amount does not meet coupon minimum'
    };
    if (couponErrors[error.message]) {
      return res.status(400).json({ message: couponErrors[error.message] });
    }
    return res.status(500).json({ message: 'Cannot create order' });
  }
};

const getOrdersForUser = async (req, res) => {
  try {
    const orders = await orderService.getOrdersForUser(req.user._id);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load order' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders(req.query);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load orders' });
  }
};

module.exports = {
  createOrder,
  getOrdersForUser,
  getOrderById,
  getAllOrders
};
