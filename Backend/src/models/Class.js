const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    maxStudents: {
      type: Number,
      required: true,
      min: 1
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'],
      default: 'OPEN'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Class', classSchema);
