const authService = require('../service/authService');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        await authService.register(email, password);
        return res.status(200).json({ message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy OTP." });
    } catch (error) {
        if (error.message === 'EMAIL_EXISTS') {
            return res.status(409).json({ message: "Email đã tồn tại trong hệ thống." });
        }
        console.error(error);
        return res.status(500).json({ message: "Lỗi Server Internal" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        return res.status(200).json({
            message: 'Đăng nhập thành công.',
            token: result.token,
            refreshToken: result.refreshToken,
            user: result.user,
            url: result.redirectUrl
        });
    } catch (error) {
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        if (error.message === 'ACCOUNT_INACTIVE') {
            return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt.' });
        }

        console.error(error);
        return res.status(500).json({ message: 'Lỗi Server Internal' });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshTokens(refreshToken);
        return res.status(200).json({
            message: 'Token refreshed successfully.',
            token: result.token,
            refreshToken: result.refreshToken
        });
    } catch (error) {
        if (error.message === 'REFRESH_TOKEN_INVALID' || error.message === 'INVALID_REFRESH_TOKEN') {
            return res.status(401).json({ message: 'Refresh token không hợp lệ.' });
        }
        if (error.message === 'REFRESH_TOKEN_EXPIRED') {
            return res.status(401).json({ message: 'Refresh token đã hết hạn.' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi Server Internal' });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);
        return res.status(200).json({ message: 'Đăng xuất thành công.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi Server Internal' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        await authService.verifyOtp(email, otp);
        return res.status(200).json({ message: "Xác thực thành công. Tài khoản đã được kích hoạt." });
    } catch (error) {
        if (error.message === 'OTP_INVALID') return res.status(400).json({ message: "Mã OTP không chính xác." });
        if (error.message === 'OTP_EXPIRED') return res.status(400).json({ message: "Mã OTP đã hết hạn." });
        return res.status(500).json({ message: "Lỗi Server Internal" });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await authService.requestPasswordReset(email);
        return res.status(200).json({ message: 'Đã gửi OTP đặt lại mật khẩu. Vui lòng kiểm tra email.' });
    } catch (error) {
        if (error.message === 'EMAIL_NOT_FOUND') {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống.' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi Server Internal' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        await authService.resetPassword(email, otp, password);
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' });
    } catch (error) {
        if (error.message === 'OTP_INVALID') return res.status(400).json({ message: 'Mã OTP không chính xác.' });
        if (error.message === 'OTP_EXPIRED') return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
        if (error.message === 'EMAIL_NOT_FOUND') return res.status(404).json({ message: 'Email không tồn tại trong hệ thống.' });
        console.error(error);
        return res.status(500).json({ message: 'Lỗi Server Internal' });
    }
};

const getProfile = async (req, res) => {
    return res.status(200).json({
        message: 'Lấy thông tin profile thành công.',
        user: req.user,
        url: req.user.role === 'ADMIN' ? '/admin/profile' : '/user/profile'
    });
};

module.exports = { register, login, refreshToken, logout, verifyOtp, forgotPassword, resetPassword, getProfile };