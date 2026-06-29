const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const { registerLimiter, loginLimiter, passwordResetLimiter } = require('../middleware/rateLimitMiddleware');

const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../validators/authValidator');

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', registerLimiter, registerValidation, authController.register);

router.post('/login', loginLimiter, loginValidation, authController.login);

router.post('/verify-otp', authController.verifyOtp);

router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, authController.forgotPassword);

router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.get('/user/profile', authenticateToken, authController.getProfile);

router.get('/admin/profile', authenticateToken, authorizeRoles('ADMIN'), authController.getProfile);

module.exports = router;