const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');

const POINT_VALUE_VND = Number(process.env.POINT_VALUE_VND || 1000);
const POINT_EARN_AMOUNT_VND = Number(process.env.POINT_EARN_AMOUNT_VND || 10000);
const REVIEW_REWARD_POINTS = Number(process.env.REVIEW_REWARD_POINTS || 10);

const getBalance = async (userId) => {
  const user = await User.findById(userId).select('loyaltyPoints');
  return Number(user?.loyaltyPoints || 0);
};

const createTransaction = async ({ userId, type, points, source, order, review, note }) => {
  const currentBalance = await getBalance(userId);
  const nextBalance = Math.max(currentBalance + Number(points || 0), 0);
  await User.findByIdAndUpdate(userId, { loyaltyPoints: nextBalance });

  return PointTransaction.create({
    user: userId,
    type,
    points,
    balanceAfter: nextBalance,
    source,
    order,
    review,
    note
  });
};

const spendPoints = async ({ userId, requestedPoints = 0, maxAmount = 0, orderId }) => {
  const balance = await getBalance(userId);
  const usablePoints = Math.min(Math.max(Number(requestedPoints || 0), 0), balance);
  const discount = Math.min(usablePoints * POINT_VALUE_VND, Math.max(Number(maxAmount || 0), 0));
  const pointsToSpend = Math.ceil(discount / POINT_VALUE_VND);

  if (pointsToSpend <= 0 || discount <= 0) {
    return { points: 0, discount: 0 };
  }

  await createTransaction({
    userId,
    type: 'SPEND',
    points: -pointsToSpend,
    source: 'ORDER',
    order: orderId,
    note: 'Redeemed points for order discount'
  });

  return { points: pointsToSpend, discount };
};

const refundSpentPoints = async ({ order }) => {
  if (!order?.pointsRedeemed || order.pointsRefunded) return null;

  const transaction = await createTransaction({
    userId: order.user,
    type: 'REFUND',
    points: order.pointsRedeemed,
    source: 'REFUND',
    order: order._id,
    note: 'Refunded points for unpaid or cancelled order'
  });

  order.pointsRefunded = true;
  await order.save();
  return transaction;
};

const awardOrderPoints = async ({ order }) => {
  if (!order || order.pointsAwarded || order.status !== 'PAID') return null;

  const earnedPoints = Math.floor(Number(order.amount || 0) / POINT_EARN_AMOUNT_VND);
  order.pointsEarned = earnedPoints;
  order.pointsAwarded = true;
  await order.save();

  if (earnedPoints <= 0) return null;

  return createTransaction({
    userId: order.user,
    type: 'EARN',
    points: earnedPoints,
    source: 'ORDER',
    order: order._id,
    note: 'Earned points from paid order'
  });
};

const awardReviewPoints = async ({ userId, reviewId }) => {
  const existing = await PointTransaction.findOne({ review: reviewId, type: 'EARN', source: 'REVIEW' });
  if (existing) return existing;

  return createTransaction({
    userId,
    type: 'EARN',
    points: REVIEW_REWARD_POINTS,
    source: 'REVIEW',
    review: reviewId,
    note: 'Earned points from course review'
  });
};

const getMyLoyalty = async (userId) => {
  const [balance, transactions] = await Promise.all([
    getBalance(userId),
    PointTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50)
  ]);

  return {
    balance,
    pointValueVnd: POINT_VALUE_VND,
    earnAmountVnd: POINT_EARN_AMOUNT_VND,
    reviewRewardPoints: REVIEW_REWARD_POINTS,
    transactions
  };
};

module.exports = {
  POINT_VALUE_VND,
  awardOrderPoints,
  awardReviewPoints,
  getMyLoyalty,
  refundSpentPoints,
  spendPoints
};
