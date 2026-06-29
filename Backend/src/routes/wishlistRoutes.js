const express = require('express');
const { body, param } = require('express-validator');
const wishlistController = require('../controllers/wishlistController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, wishlistController.listWishlist);
router.post('/', authenticateToken, [body('course').isMongoId(), validate], wishlistController.addWishlist);
router.delete('/:courseId', authenticateToken, [param('courseId').isMongoId(), validate], wishlistController.removeWishlist);

module.exports = router;
