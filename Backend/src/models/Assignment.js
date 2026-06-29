const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    dueDate: { type: Date },
    maxScore: { type: Number, default: 100 },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
