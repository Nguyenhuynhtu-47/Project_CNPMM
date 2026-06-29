const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    pinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
