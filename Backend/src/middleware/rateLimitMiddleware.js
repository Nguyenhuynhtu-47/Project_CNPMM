const rateLimit =
    require('express-rate-limit');

const registerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        message:
            'Quá nhiều yêu cầu, vui lòng thử lại sau 10 phút.'
    }
});



module.exports = {
    registerLimiter,
    loginLimiter,
    passwordResetLimiter,
    profileUpdateLimiter
};