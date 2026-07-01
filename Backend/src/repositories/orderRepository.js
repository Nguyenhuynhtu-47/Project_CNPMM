const BaseRepository = require('./baseRepository');
const Order = require('../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  findByUserWithDetails(userId) {
    return this.model.find({ user: userId })
      .populate('course', 'title price')
      .populate('class', 'code startDate endDate')
      .sort({ createdAt: -1 });
  }

  findByIdWithDetails(orderId) {
    return this.model.findById(orderId)
      .populate('course', 'title price')
      .populate('class', 'code startDate endDate');
  }

  findAllWithDetails(filter = {}) {
    return this.model.find(filter)
      .populate('user', 'fullName email')
      .populate('course', 'title price')
      .populate('class', 'code startDate endDate')
      .sort({ createdAt: -1 });
  }

  findExpiredPending(now = new Date()) {
    return this.model.find({
      status: 'PENDING',
      expiresAt: { $lte: now }
    }).populate('course', 'title');
  }

  cancelExpiredPending(orderIds, now = new Date()) {
    return this.model.updateMany(
      {
        _id: { $in: orderIds },
        status: 'PENDING'
      },
      {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelReason: 'PAYMENT_TIMEOUT'
      }
    );
  }
}

module.exports = new OrderRepository();


