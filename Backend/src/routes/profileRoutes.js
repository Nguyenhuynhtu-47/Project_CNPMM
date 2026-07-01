const express = require('express');

const router = express.Router();

const profileController = require('../controllers/profileController');

const { updateProfileValidator } = require('../validators/profileValidator');

const { authenticateToken } = require('../middleware/authMiddleware');

const { profileUpdateLimiter } = require('../middleware/rateLimitMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.put('/profile', profileUpdateLimiter, authenticateToken, upload.single('avatarFile'), updateProfileValidator, profileController.updateProfile);

module.exports = router;
