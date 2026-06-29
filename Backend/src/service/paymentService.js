const crypto = require('crypto');
const queryString = require('querystring');
const paymentRepository = require('../repositories/paymentRepository');

const buildVnpayIdempotencyKey = (query = {}) => [
  'VNPAY',
  query.vnp_TxnRef || 'NO_ORDER',
  query.vnp_TransactionNo || 'NO_TRANSACTION',
  query.vnp_ResponseCode || 'NO_RESPONSE'
].join(':');

const buildVnpayUrl = ({ amount, orderInfo, txnRef, ipAddr }) => {
  const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const vnpTmnCode = process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE';
  const vnpHashSecret = process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET';
  const vnpReturnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:8080/api/payments/vnpay-return';

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpTmnCode,
    vnp_Amount: amount * 100,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'education',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: vnpReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')
  };

  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});

  const signData = queryString.stringify(sortedParams, { encode: false });
  const secureHash = crypto
    .createHmac('sha512', vnpHashSecret)
    .update(signData)
    .digest('hex');

  const url = `${vnpUrl}?${queryString.stringify(sortedParams, { encode: false })}&vnp_SecureHash=${secureHash}`;
  return url;
};

const verifyVnpayResponse = (query) => {
  const secureHash = query.vnp_SecureHash || query.vnp_SecureHashType;
  const { vnp_SecureHash: _hash, ...inputData } = query;
  const vnpHashSecret = process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET';

  const sorted = Object.keys(inputData).sort().reduce((acc, key) => {
    if (key !== 'vnp_SecureHash') acc[key] = inputData[key];
    return acc;
  }, {});

  const signData = queryString.stringify(sorted, { encode: false });
  const computedHash = crypto.createHmac('sha512', vnpHashSecret).update(signData).digest('hex');

  return computedHash === _hash;
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
