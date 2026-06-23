const express = require('express');

const router = express.Router();

const profileController = require('../controllers/profileController');

const { updateProfileValidator } = require('../validators/profileValidator');

const { authenticateToken } = require('../middleware/authMiddleware');

const { profileUpdateLimiter } = require('../middleware/rateLimitMiddleware');

router.put('/profile', profileUpdateLimiter, authenticateToken, updateProfileValidator, profileController.updateProfile);

module.exports = router;