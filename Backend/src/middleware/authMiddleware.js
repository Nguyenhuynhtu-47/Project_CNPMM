const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Thiếu token xác thực.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');

        const user = await User.findById(payload.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này.' });
    }

    next();
};

module.exports = { authenticateToken, authorizeRoles };