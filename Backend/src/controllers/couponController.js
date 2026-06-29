const couponService = require('../service/couponService');

const listCoupons = async (req, res) => {
  try {
    const coupons = await couponService.listCoupons();
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load coupons' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    return res.status(201).json({ message: 'Coupon created', coupon });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Coupon code already exists' });
    console.error(error);
    return res.status(500).json({ message: 'Cannot create coupon' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    return res.status(200).json({ message: 'Coupon updated', coupon });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Coupon code already exists' });
    console.error(error);
    return res.status(500).json({ message: 'Cannot update coupon' });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const result = await couponService.validateCoupon({
      code: req.body.code,
      userId: req.user._id,
      subtotal: Number(req.body.subtotal || 0)
    });

    return res.status(200).json({
      coupon: result.coupon,
      discount: result.discount
    });
  } catch (error) {
    const messages = {
      COUPON_NOT_FOUND: 'Coupon not found',
      COUPON_INACTIVE: 'Coupon is inactive or expired',
      COUPON_USAGE_LIMIT: 'Coupon usage limit reached',
      COUPON_USER_LIMIT: 'You already used this coupon',
      COUPON_MIN_ORDER: 'Order amount does not meet coupon minimum'
    };
    if (messages[error.message]) return res.status(400).json({ message: messages[error.message] });
    console.error(error);
    return res.status(500).json({ message: 'Cannot validate coupon' });
  }
};

module.exports = {
  createCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon
};
