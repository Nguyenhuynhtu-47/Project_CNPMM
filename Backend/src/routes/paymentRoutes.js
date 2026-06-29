const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateMiddleware');

router.post('/vnpay', authenticateToken, [
  body('courseId').isMongoId().withMessage('Course id is required'),
  body('amount').optional().isNumeric().withMessage('Amount must be numeric'),
  body('couponCode').optional().isString(),
  body('pointsToUse').optional().isInt({ min: 0 }).withMessage('Points must be a positive number'),
  validate
], paymentController.createPayment);

router.get('/vnpay-return', paymentController.handleVnpayReturn);

module.exports = router;
