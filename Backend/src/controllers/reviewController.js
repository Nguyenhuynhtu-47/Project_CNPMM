const Review = require('../models/Review');
const Enrollment = require('../models/Enrollment');
const loyaltyService = require('../service/loyaltyService');

const createReview = async (req, res) => {
  try {
    const enrolled = await Enrollment.exists({ user: req.user._id, course: req.body.course, status: { $ne: 'CANCELLED' } });
    if (!enrolled) return res.status(403).json({ message: 'Only enrolled students can review this course' });

    const existingReview = await Review.findOne({ user: req.user._id, course: req.body.course });
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, course: req.body.course },
      {
        user: req.user._id,
        course: req.body.course,
        rating: req.body.rating,
        content: req.body.content,
        images: req.body.images || [],
        rewardType: 'POINT',
        rewardValue: 10
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'fullName avatar');
    if (!existingReview) {
      await loyaltyService.awardReviewPoints({ userId: req.user._id, reviewId: review._id });
    }
    return res.status(200).json({ message: 'Review saved', review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot save review' });
  }
};

const listCourseReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId, visible: true })
      .populate('user', 'fullName avatar')
      .sort({ createdAt: -1 });
    return res.status(200).json({ reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load reviews' });
  }
};

module.exports = {
  createReview,
  listCourseReviews
};
