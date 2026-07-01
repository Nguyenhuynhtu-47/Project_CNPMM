const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

lessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
