const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    method: { type: String, enum: ['ONLINE_CLASS', 'VIDEO_WATCH'], default: 'ONLINE_CLASS' },
    watchedPercent: { type: Number, min: 0, max: 100, default: 0 },
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, class: 1, lesson: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
