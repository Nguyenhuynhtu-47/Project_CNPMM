const Comment = require('../models/Comment');

const listClassComments = async (req, res) => {
  try {
    const comments = await Comment.find({ class: req.params.classId })
      .populate('author', 'fullName avatar role')
      .sort({ pinned: -1, createdAt: -1 });
    return res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load comments' });
  }
};

const createComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      class: req.body.class,
      author: req.user._id,
      parent: req.body.parent,
      title: req.body.title,
      content: req.body.content
    });
    await comment.populate('author', 'fullName avatar role');
    return res.status(201).json({ message: 'Comment created', comment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot create comment' });
  }
};

const pinComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { pinned: Boolean(req.body.pinned) }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    return res.status(200).json({ message: 'Comment updated', comment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update comment' });
  }
};

module.exports = {
  listClassComments,
  createComment,
  pinComment
};
