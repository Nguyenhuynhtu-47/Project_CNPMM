const express = require('express');
const { body, param } = require('express-validator');
const couponController = require('../controllers/couponController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/validate',
  authenticateToken,
  [
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('subtotal').isNumeric().withMessage('Subtotal is required'),
    validate
  ],
  couponController.validateCoupon
);

router.get('/', authenticateToken, authorizePermissions('PAYMENT_MANAGE'), couponController.listCoupons);

router.post(
  '/',
  authenticateToken,
  authorizePermissions('PAYMENT_MANAGE'),
  [
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('name').notEmpty().withMessage('Coupon name is required'),
    body('discountType').isIn(['PERCENT', 'FIXED']).withMessage('Invalid discount type'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value is required'),
    validate
  ],
  couponController.createCoupon
);

router.put(
  '/:id',
  authenticateToken,
  authorizePermissions('PAYMENT_MANAGE'),
  [
    param('id').isMongoId().withMessage('Coupon id is invalid'),
    validate
  ],
  couponController.updateCoupon
);

module.exports = router;
