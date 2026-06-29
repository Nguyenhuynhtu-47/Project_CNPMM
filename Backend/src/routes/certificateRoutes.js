const express = require('express');
const { body, param } = require('express-validator');
const certificateController = require('../controllers/certificateController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authenticateToken, certificateController.listMyCertificates);
router.get('/verify/:code', [param('code').notEmpty(), validate], certificateController.verifyCertificate);
router.get('/pdf/:code', [param('code').notEmpty(), validate], certificateController.downloadCertificatePdf);
router.post(
  '/',
  authenticateToken,
  authorizePermissions('CERTIFICATE_MANAGE'),
  [
    body('enrollment').isMongoId().withMessage('Enrollment id is required'),
    body('finalScore').isNumeric().withMessage('Final score is required'),
    validate
  ],
  certificateController.issueCertificate
);
router.delete('/:id', authenticateToken, authorizePermissions('CERTIFICATE_MANAGE'), [param('id').isMongoId(), validate], certificateController.revokeCertificate);

module.exports = router;
