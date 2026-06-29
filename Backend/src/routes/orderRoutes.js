const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');
const { param } = require('express-validator');
const validate = require('../middleware/validateMiddleware');

router.post('/', authenticateToken, orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrdersForUser);
router.get('/admin/all', authenticateToken, authorizePermissions('PAYMENT_READ'), orderController.getAllOrders);
router.get('/:id', authenticateToken, param('id').isMongoId(), validate, orderController.getOrderById);

module.exports = router;
