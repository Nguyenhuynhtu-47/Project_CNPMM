const { body } =
    require('express-validator');

const validate =
    require('../middleware/validateMiddleware');

const registerValidation = [
    body('email')
        .isEmail()
        .withMessage(
            'Định dạng email không hợp lệ'
        ),

    body('password')
        .isLength({ min: 6 })
        .withMessage(
            'Mật khẩu phải từ 6 ký tự trở lên'
        ),

    body('confirmPassword')
        .custom((value, { req }) => value === req.body.password)
        .withMessage(
            'Mật khẩu xác nhận không khớp'
        ),

    validate
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage(
            'Định dạng email không hợp lệ'
        ),

    body('password')
        .notEmpty()
        .withMessage(
            'Mật khẩu là bắt buộc'
        ),

    validate
];

const forgotPasswordValidation = [
    body('email')
        .isEmail()
        .withMessage(
            'Định dạng email không hợp lệ'
        ),

    validate
];

const resetPasswordValidation = [
    body('email')
        .isEmail()
        .withMessage(
            'Định dạng email không hợp lệ'
        ),

    body('otp')
        .isLength({
            min: 6,
            max: 6
        })
        .withMessage(
            'OTP phải gồm 6 số'
        ),

    body('password')
        .isLength({ min: 6 })
        .withMessage(
            'Mật khẩu phải từ 6 ký tự trở lên'
        ),

    validate
];

module.exports = {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
};