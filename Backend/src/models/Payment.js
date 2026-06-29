const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    provider: { type: String, default: 'VNPAY' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    transactionRef: { type: String, default: '' },
    providerTransactionNo: { type: String, default: '' },
    responseCode: { type: String, default: '' },
    idempotencyKey: { type: String, required: true, unique: true },
    rawCallback: { type: mongoose.Schema.Types.Mixed, default: {} },
    signatureValid: { type: Boolean, default: false },
    processedAt: { type: Date }
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ provider: 1, transactionRef: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
