const crypto = require('crypto');
const paymentRepository = require('../repositories/paymentRepository');

const buildVnpayIdempotencyKey = (query = {}) => [
  'VNPAY',
  query.vnp_TxnRef || 'NO_ORDER',
  query.vnp_TransactionNo || 'NO_TRANSACTION',
  query.vnp_ResponseCode || 'NO_RESPONSE'
].join(':');

const pad = (value) => String(value).padStart(2, '0');

const formatVnpayDate = (date = new Date()) => {
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return [
    vnDate.getUTCFullYear(),
    pad(vnDate.getUTCMonth() + 1),
    pad(vnDate.getUTCDate()),
    pad(vnDate.getUTCHours()),
    pad(vnDate.getUTCMinutes()),
    pad(vnDate.getUTCSeconds())
  ].join('');
};

const normalizeIpAddress = (ipAddr = '') => {
  if (!ipAddr || ipAddr === '::1') return '127.0.0.1';
  return String(ipAddr).replace(/^::ffff:/, '');
};

const getEnvValue = (key, fallback) => String(process.env[key] || fallback).trim();

const encodeVnpayValue = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');

const sortVnpayParams = (params) => {
  return Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') return acc;
      acc[key] = encodeVnpayValue(params[key]);
      return acc;
    }, {});
};

const stringifyVnpayParams = (params) => {
  return Object.keys(params).map((key) => `${key}=${params[key]}`).join('&');
};

const buildVnpayUrl = ({ amount, orderInfo, txnRef, ipAddr }) => {
  const vnpUrl = getEnvValue('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
  const vnpTmnCode = getEnvValue('VNPAY_TMN_CODE', 'YOUR_TMN_CODE');
  const vnpHashSecret = getEnvValue('VNPAY_HASH_SECRET', 'YOUR_HASH_SECRET');
  const vnpReturnUrl = getEnvValue('VNPAY_RETURN_URL', 'http://localhost:8080/api/payments/vnpay-return');
  const createDate = new Date();
  const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000);

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpTmnCode,
    vnp_Amount: Math.round(Number(amount || 0) * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: vnpReturnUrl,
    vnp_IpAddr: normalizeIpAddress(ipAddr),
    vnp_CreateDate: formatVnpayDate(createDate),
    vnp_ExpireDate: formatVnpayDate(expireDate)
  };

  const sortedParams = sortVnpayParams(params);
  const signData = stringifyVnpayParams(sortedParams);
  const secureHash = crypto
    .createHmac('sha512', vnpHashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const url = `${vnpUrl}?${stringifyVnpayParams({ ...sortedParams, vnp_SecureHash: secureHash })}`;
  return url;
};

const verifyVnpayResponse = (query) => {
  const { vnp_SecureHash: secureHash, vnp_SecureHashType: _hashType, ...inputData } = query;
  const vnpHashSecret = getEnvValue('VNPAY_HASH_SECRET', 'YOUR_HASH_SECRET');

  const signData = stringifyVnpayParams(sortVnpayParams(inputData));
  const computedHash = crypto
    .createHmac('sha512', vnpHashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return computedHash === String(secureHash || '').toLowerCase();
};

const createPaymentAttempt = async ({ order, provider = 'VNPAY' }) => {
  const idempotencyKey = `${provider}:INIT:${order._id}`;
  const existingPayment = await paymentRepository.findByIdempotencyKey(idempotencyKey);
  if (existingPayment) return existingPayment;

  return paymentRepository.create({
    order: order._id,
    user: order.user,
    course: order.course?._id || order.course,
    provider,
    amount: order.amount,
    currency: order.currency || 'VND',
    status: 'PENDING',
    transactionRef: order._id.toString(),
    idempotencyKey
  });
};

const recordVnpayCallback = async ({ query, order, signatureValid }) => {
  const idempotencyKey = buildVnpayIdempotencyKey(query);
  const existingPayment = await paymentRepository.findByIdempotencyKey(idempotencyKey);
  if (existingPayment) return { payment: existingPayment, duplicate: true };

  const responseCode = query.vnp_ResponseCode || '';
  const status = responseCode === '00' ? 'PAID' : 'FAILED';
  const payment = await paymentRepository.create({
    order: query.vnp_TxnRef,
    user: order?.user,
    course: order?.course,
    provider: 'VNPAY',
    amount: Number(query.vnp_Amount || 0) / 100,
    currency: query.vnp_CurrCode || 'VND',
    status,
    transactionRef: query.vnp_TxnRef || '',
    providerTransactionNo: query.vnp_TransactionNo || '',
    responseCode,
    idempotencyKey,
    rawCallback: query,
    signatureValid,
    processedAt: new Date()
  });

  return { payment, duplicate: false };
};

module.exports = {
  buildVnpayUrl,
  createPaymentAttempt,
  recordVnpayCallback,
  verifyVnpayResponse
};
