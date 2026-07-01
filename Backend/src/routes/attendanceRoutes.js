const express = require('express');
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authenticateToken, attendanceController.getMyAttendance);
router.get('/summary', authenticateToken, authorizePermissions('ATTENDANCE_READ'), attendanceController.getAttendanceSummary);
router.get('/', authenticateToken, authorizePermissions('CLASS_READ'), attendanceController.listAttendance);
router.post(
  '/',
  authenticateToken,
  [
    body('class').isMongoId().withMessage('Class id is required'),
    body('watchedPercent').optional().isFloat({ min: 0, max: 100 }),
    body('attendanceDate').optional().isISO8601().withMessage('Attendance date must be a valid date'),
    body('date').optional().isISO8601().withMessage('Attendance date must be a valid date'),
    validate
  ],
  attendanceController.markAttendance
);

module.exports = router;
