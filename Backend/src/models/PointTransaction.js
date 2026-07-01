const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['EARN', 'SPEND', 'REFUND', 'ADJUST'],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      enum: ['ORDER', 'REVIEW', 'ADMIN', 'REFUND'],
      default: 'ORDER'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    note: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

pointTransactionSchema.index({ user: 1, createdAt: -1 });
pointTransactionSchema.index({ order: 1, type: 1 });
pointTransactionSchema.index({ review: 1, type: 1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
