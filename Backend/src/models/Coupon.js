const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FIXED'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 0
    },
    active: {
      type: Boolean,
      default: true
    },
    startsAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1, startsAt: 1, expiresAt: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
