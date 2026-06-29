const express = require('express');
const loyaltyController = require('../controllers/loyaltyController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authenticateToken, loyaltyController.getMyLoyalty);

module.exports = router;
