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
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    couponCode: {
      type: String,
      default: ''
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    pointsRedeemed: {
      type: Number,
      default: 0,
      min: 0
    },
    pointsDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    pointsAwarded: {
      type: Boolean,
      default: false
    },
    pointsRefunded: {
      type: Boolean,
      default: false
    },
    couponUsageCounted: {
      type: Boolean,
      default: false
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
