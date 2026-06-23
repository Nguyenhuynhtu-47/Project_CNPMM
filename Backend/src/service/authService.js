const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/OTP');
const emailService = require('./emailService');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (email, password) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('EMAIL_EXISTS');

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, status: 'INACTIVE' });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({ email, otp_code: otpCode, expiresAt });
    await emailService.sendOtpMail(email, otpCode);
};

const verifyOtp = async (email, otpCode) => {
    const otpRecord = await Otp.findOne({ email, otp_code: otpCode }).sort({ createdAt: -1 });
    if (!otpRecord) throw new Error('OTP_INVALID');
    if (new Date() > otpRecord.expiresAt) throw new Error('OTP_EXPIRED');

    await User.findOneAndUpdate({ email }, { status: 'ACTIVE' });
    await Otp.deleteMany({ email });
};

const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('EMAIL_NOT_FOUND');

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({ email, otp_code: otpCode, expiresAt });
    await emailService.sendPasswordResetOtpMail(email, otpCode);
};

const resetPassword = async (email, otpCode, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('EMAIL_NOT_FOUND');

    const otpRecord = await Otp.findOne({ email, otp_code: otpCode }).sort({ createdAt: -1 });
    if (!otpRecord) throw new Error('OTP_INVALID');
    if (new Date() > otpRecord.expiresAt) throw new Error('OTP_EXPIRED');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await Otp.deleteMany({ email });
};

const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('INVALID_CREDENTIALS');

    if (user.status !== 'ACTIVE') throw new Error('ACCOUNT_INACTIVE');

    const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'dev_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return {
        token,
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            avatar: user.avatar
        },
        redirectUrl: user.role === 'ADMIN' ? '/admin/profile' : '/user/profile'
    };
};

module.exports = { register, verifyOtp, requestPasswordReset, resetPassword, login };