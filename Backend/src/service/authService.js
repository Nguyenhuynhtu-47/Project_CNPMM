const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const emailService = require('./emailService');
const tokenService = require('./tokenService');
const rbacService = require('./rbacService');
const otpService = require('./otpService');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (email, password) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('EMAIL_EXISTS');

    const hashedPassword = await bcrypt.hash(password, 10);
    await rbacService.seedDefaultRbac();
    const studentRole = await Role.findOne({ code: 'STUDENT', active: true });
    await User.create({
        email,
        password: hashedPassword,
        role: 'STUDENT',
        roleRef: studentRole?._id,
        status: 'INACTIVE'
    });

    const otpCode = generateOtp();

    await otpService.saveOtp({ email, otpCode, purpose: 'verify-email' });
    await emailService.sendOtpMail(email, otpCode);
};

const verifyOtp = async (email, otpCode) => {
    await otpService.verifyOtp({ email, otpCode, purpose: 'verify-email' });

    await User.findOneAndUpdate({ email }, { status: 'ACTIVE' });
    await otpService.consumeOtp({ email, purpose: 'verify-email' });
};

const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('EMAIL_NOT_FOUND');

    const otpCode = generateOtp();

    await otpService.saveOtp({ email, otpCode, purpose: 'reset-password' });
    await emailService.sendPasswordResetOtpMail(email, otpCode);
};

const resetPassword = async (email, otpCode, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('EMAIL_NOT_FOUND');

    await otpService.verifyOtp({ email, otpCode, purpose: 'reset-password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await otpService.consumeOtp({ email, purpose: 'reset-password' });
};

const login = async (email, password) => {
    const user = await User.findOne({ email }).populate({
        path: 'roleRef',
        populate: {
            path: 'permissions',
            select: 'code name module'
        }
    });
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('INVALID_CREDENTIALS');

    if (user.status !== 'ACTIVE') throw new Error('ACCOUNT_INACTIVE');

    const syncedUser = await rbacService.ensureUserRoleRef(user);
    const normalizedRole = rbacService.normalizeRoleCode(syncedUser.role);
    const permissions = syncedUser.roleRef?.permissions?.map((permission) => permission.code) || [];
    const accessToken = tokenService.createAccessToken({ id: syncedUser._id, email: syncedUser.email, role: normalizedRole, permissions });
    const refreshToken = await tokenService.createRefreshToken(syncedUser);

    return {
        token: accessToken,
        refreshToken,
        user: {
            id: syncedUser._id,
            email: syncedUser.email,
            role: normalizedRole,
            permissions,
            fullName: syncedUser.fullName,
            avatar: syncedUser.avatar
        },
        redirectUrl: normalizedRole === 'ADMIN' ? '/admin/profile' : '/user/profile'
    };
};

const refreshTokens = async (refreshToken) => {
    const payload = await tokenService.verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.id).populate({
        path: 'roleRef',
        populate: {
            path: 'permissions',
            select: 'code name module'
        }
    });
    if (!user) throw new Error('INVALID_REFRESH_TOKEN');

    const syncedUser = await rbacService.ensureUserRoleRef(user);
    const normalizedRole = rbacService.normalizeRoleCode(syncedUser.role);
    const permissions = syncedUser.roleRef?.permissions?.map((permission) => permission.code) || [];
    const accessToken = tokenService.createAccessToken({ id: syncedUser._id, email: syncedUser.email, role: normalizedRole, permissions });
    const newRefreshToken = await tokenService.createRefreshToken(syncedUser);
    await tokenService.revokeRefreshToken(refreshToken);

    return {
        token: accessToken,
        refreshToken: newRefreshToken
    };
};

const logout = async (refreshToken) => {
    await tokenService.revokeRefreshToken(refreshToken);
};

module.exports = { register, verifyOtp, requestPasswordReset, resetPassword, login, refreshTokens, logout };
