const express = require('express');
const { body, param } = require('express-validator');
const siteController = require('../controllers/siteController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/banners', siteController.listBanners);
router.post('/banners', authenticateToken, authorizePermissions('BANNER_MANAGE'), [body('title').notEmpty(), body('imageUrl').notEmpty(), validate], siteController.saveBanner);
router.put('/banners/:id', authenticateToken, authorizePermissions('BANNER_MANAGE'), [param('id').isMongoId(), validate], siteController.saveBanner);
router.delete('/banners/:id', authenticateToken, authorizePermissions('BANNER_MANAGE'), [param('id').isMongoId(), validate], siteController.deleteBanner);
router.patch('/banners/reorder', authenticateToken, authorizePermissions('BANNER_MANAGE'), [body('items').isArray(), validate], siteController.reorderBanners);
router.get('/settings/public', siteController.listPublicSettings);
router.get('/settings', authenticateToken, authorizePermissions('SETTING_MANAGE'), siteController.listSettings);
router.post('/settings', authenticateToken, authorizePermissions('SETTING_MANAGE'), [body('key').notEmpty(), validate], siteController.upsertSetting);
router.delete('/settings/:key', authenticateToken, authorizePermissions('SETTING_MANAGE'), siteController.deleteSetting);

module.exports = router;
