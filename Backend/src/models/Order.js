const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String,
      default: 'VNPAY'
    },
    providerData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    transactionRef: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancelReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
