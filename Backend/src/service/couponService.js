const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const normalizeCode = (code = '') => String(code).trim().toUpperCase();
const normalizeDiscountType = (type = 'PERCENT') => {
  const normalizedType = String(type).trim().toUpperCase();
  if (['FIXED', 'FIXED_AMOUNT', 'AMOUNT'].includes(normalizedType)) return 'FIXED';
  return 'PERCENT';
};

const isCouponInWindow = (coupon, now = new Date()) => {
  if (!coupon.active) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.expiresAt && coupon.expiresAt < now) return false;
  return true;
};

const calculateDiscount = (coupon, amount) => {
  if (!coupon || amount <= 0) return 0;

  const discountType = normalizeDiscountType(coupon.discountType);
  const discountValue = Number(coupon.discountValue || 0);

  if (discountType === 'FIXED') {
    return Math.min(Math.max(discountValue, 0), amount);
  }

  const rawDiscount = Math.floor(amount * (discountValue / 100));

  const cappedDiscount = coupon.maxDiscountAmount > 0
    ? Math.min(rawDiscount, coupon.maxDiscountAmount)
    : rawDiscount;

  return Math.min(Math.max(cappedDiscount, 0), amount);
};

const getUserPaidUsageCount = async ({ userId, couponId }) => {
  return Order.countDocuments({
    user: userId,
    coupon: couponId,
    status: 'PAID'
  });
};

const validateCoupon = async ({ code, userId, subtotal }) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return { coupon: null, discount: 0 };

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) throw new Error('COUPON_NOT_FOUND');
  if (!isCouponInWindow(coupon)) throw new Error('COUPON_INACTIVE');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new Error('COUPON_USAGE_LIMIT');
  if (subtotal < coupon.minOrderAmount) throw new Error('COUPON_MIN_ORDER');

  if (coupon.perUserLimit > 0 && userId) {
    const usedByUser = await getUserPaidUsageCount({ userId, couponId: coupon._id });
    if (usedByUser >= coupon.perUserLimit) throw new Error('COUPON_USER_LIMIT');
  }

  return {
    coupon,
    discount: calculateDiscount(coupon, subtotal)
  };
};

const listCoupons = async () => {
  return Coupon.find().sort({ createdAt: -1 });
};

const createCoupon = async (data) => {
  return Coupon.create({
    ...data,
    code: normalizeCode(data.code),
    discountType: normalizeDiscountType(data.discountType)
  });
};

const updateCoupon = async (id, data) => {
  const payload = { ...data };
  if (payload.code) payload.code = normalizeCode(payload.code);
  if (payload.discountType) payload.discountType = normalizeDiscountType(payload.discountType);
  return Coupon.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

const countCouponUsage = async (couponId) => {
  if (!couponId) return;
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
};

module.exports = {
  calculateDiscount,
  countCouponUsage,
  createCoupon,
  listCoupons,
  normalizeCode,
  normalizeDiscountType,
  updateCoupon,
  validateCoupon
};
