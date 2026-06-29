const express = require('express');
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/overview', authenticateToken, authorizePermissions('REPORT_READ'), statisticsController.getOverview);

module.exports = router;
