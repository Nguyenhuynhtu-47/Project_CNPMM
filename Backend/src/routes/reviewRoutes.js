const express = require('express');
const { body, param } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/course/:courseId', [param('courseId').isMongoId(), validate], reviewController.listCourseReviews);
router.post(
  '/',
  authenticateToken,
  [
    body('course').isMongoId().withMessage('Course id is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    validate
  ],
  reviewController.createReview
);

module.exports = router;
