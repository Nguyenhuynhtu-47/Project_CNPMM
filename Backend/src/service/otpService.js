const Otp = require('../models/OTP');
const { connectRedis } = require('../config/redis');

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS) || 5 * 60;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getOtpKey = (purpose, email) => `otp:${purpose}:${normalizeEmail(email)}`;

const saveOtp = async ({ email, otpCode, purpose = 'verify-email' }) => {
  const normalizedEmail = normalizeEmail(email);
  const redis = await connectRedis();

  if (redis?.isOpen) {
    await redis.set(getOtpKey(purpose, normalizedEmail), otpCode, { EX: OTP_TTL_SECONDS });
  }

  await Otp.deleteMany({ email: normalizedEmail });
  await Otp.create({
    email: normalizedEmail,
    otp_code: otpCode,
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000)
  });
};

const verifyOtp = async ({ email, otpCode, purpose = 'verify-email' }) => {
  const normalizedEmail = normalizeEmail(email);
  const redis = await connectRedis();

  if (redis?.isOpen) {
    const cachedOtp = await redis.get(getOtpKey(purpose, normalizedEmail));
    if (cachedOtp) {
      if (cachedOtp !== otpCode) throw new Error('OTP_INVALID');
      return true;
    }
  }

  const otpRecord = await Otp.findOne({ email: normalizedEmail, otp_code: otpCode }).sort({ createdAt: -1 });
  if (!otpRecord) throw new Error('OTP_INVALID');
  if (new Date() > otpRecord.expiresAt) throw new Error('OTP_EXPIRED');

  return true;
};

const consumeOtp = async ({ email, purpose = 'verify-email' }) => {
  const normalizedEmail = normalizeEmail(email);
  const redis = await connectRedis();

  if (redis?.isOpen) {
    await redis.del(getOtpKey(purpose, normalizedEmail));
  }

  await Otp.deleteMany({ email: normalizedEmail });
};

module.exports = {
  saveOtp,
  verifyOtp,
  consumeOtp
};
