const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOtpMail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mã OTP Xác Nhận Đăng Ký Tài Khoản',
        html: `<h3>Mã OTP của bạn là: <b>${otp}</b></h3><p>Mã này có hiệu lực trong 5 phút.</p>`
    };
    await transporter.sendMail(mailOptions);
};

const sendPasswordResetOtpMail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mã OTP Đặt Lại Mật Khẩu',
        html: `<h3>Mã OTP đặt lại mật khẩu của bạn là: <b>${otp}</b></h3><p>Mã này có hiệu lực trong 5 phút.</p>`
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpMail, sendPasswordResetOtpMail };