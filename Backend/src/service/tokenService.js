const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const { normalizeRoleCode } = require('./rbacService');

const createAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'dev_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const createRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: normalizeRoleCode(user.roleRef?.code || user.role) },
    process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ token, user: user._id, expiresAt });

  return token;
};

const verifyRefreshToken = async (token) => {
  const tokenRecord = await RefreshToken.findOne({ token, revoked: false });
  if (!tokenRecord) throw new Error('REFRESH_TOKEN_INVALID');
  if (new Date() > tokenRecord.expiresAt) throw new Error('REFRESH_TOKEN_EXPIRED');

  const payload = jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret'
  );

  return payload;
};

const revokeRefreshToken = async (token) => {
  await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken
};
