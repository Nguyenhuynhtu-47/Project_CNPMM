const BaseRepository = require('./baseRepository');
const Payment = require('../models/Payment');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  findByIdempotencyKey(idempotencyKey) {
    return this.model.findOne({ idempotencyKey });
  }

  findAllWithDetails(filter = {}) {
    return this.model.find(filter)
      .populate('order', 'status amount')
      .populate('user', 'fullName email')
      .populate('course', 'title price')
      .sort({ createdAt: -1 });
  }
}

module.exports = new PaymentRepository();
