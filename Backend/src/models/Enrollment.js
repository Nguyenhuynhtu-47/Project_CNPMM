const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['WAITING_CLASS', 'ASSIGNED_CLASS', 'LEARNING', 'COMPLETED', 'CANCELLED'],
      default: 'WAITING_CLASS'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    },
    completionNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
