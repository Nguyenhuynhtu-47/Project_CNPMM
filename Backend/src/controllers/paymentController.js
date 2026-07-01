const paymentService = require('../service/paymentService');
const orderService = require('../service/orderService');

const buildPaymentResultUrl = ({ status, orderId = '', responseCode = '', message = '' }) => {
  const baseUrl = String(process.env.FRONTEND_PAYMENT_RESULT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const targetUrl = new URL(baseUrl.endsWith('/payment-result') ? baseUrl : baseUrl + '/payment-result');

  targetUrl.searchParams.set('status', status);
  if (orderId) targetUrl.searchParams.set('orderId', orderId);
  if (responseCode) targetUrl.searchParams.set('responseCode', responseCode);
  if (message) targetUrl.searchParams.set('message', message);

  return targetUrl.toString();
};

const redirectToPaymentResult = (res, payload) => {
  return res.redirect(buildPaymentResultUrl(payload));
};

const couponErrors = {
  COUPON_NOT_FOUND: 'Coupon not found',
  COUPON_INACTIVE: 'Coupon is inactive or expired',
  COUPON_USAGE_LIMIT: 'Coupon usage limit reached',
  COUPON_USER_LIMIT: 'You already used this coupon',
  COUPON_MIN_ORDER: 'Order amount does not meet coupon minimum'
};

const previewPayment = async (req, res) => {
  try {
    const { courseId, couponCode, pointsToUse } = req.body;
    const preview = await orderService.previewOrder({
      userId: req.user._id,
      courseId,
      couponCode,
      pointsToUse
    });

    return res.status(200).json({ preview });
  } catch (error) {
    console.error(error);
    if (error.message === 'COURSE_NOT_FOUND') return res.status(404).json({ message: 'Course not found' });
    if (error.message === 'COURSE_ALREADY_ENROLLED') return res.status(409).json({ message: 'You are already learning this course.' });
    if (couponErrors[error.message]) return res.status(400).json({ message: couponErrors[error.message] });
    return res.status(500).json({ message: 'Cannot preview payment' });
  }
};

const createPayment = async (req, res) => {
  try {
    const { courseId, couponCode, pointsToUse } = req.body;
    const order = await orderService.createOrder({
      userId: req.user._id,
      courseId,
      couponCode,
      pointsToUse
    });

    if (Number(order.amount || 0) <= 0) {
      const paidOrder = await orderService.markOrderPaid(order._id, {
        transactionRef: 'FULL_DISCOUNT',
        vnpResponseCode: '00',
        rawCallback: { source: 'FULL_DISCOUNT' }
      });
      return res.status(200).json({
        message: 'Order paid by coupon or loyalty points',
        paid: true,
        orderId: paidOrder._id,
        order: paidOrder
      });
    }

    const txnRef = order._id.toString();
    const vnpUrl = paymentService.buildVnpayUrl({
      amount: order.amount,
      orderInfo: `Payment for course ${order.course?.title || order.course}`,
      txnRef,
      ipAddr: req.ip
    });
    await paymentService.createPaymentAttempt({ order });

    return res.status(200).json({ paymentUrl: vnpUrl, orderId: order._id });
  } catch (error) {
    console.error(error);
    if (error.message === 'COURSE_ALREADY_ENROLLED') {
      return res.status(409).json({ message: 'You are already learning this course.' });
    }
    if (couponErrors[error.message]) {
      return res.status(400).json({ message: couponErrors[error.message] });
    }
    return res.status(500).json({ message: 'Cannot create payment' });
  }
};

const handleVnpayReturn = async (req, res) => {
  try {
    const valid = paymentService.verifyVnpayResponse(req.query);

    if (!valid) {
      return redirectToPaymentResult(res, {
        status: 'failed',
        message: 'Invalid payment signature'
      });
    }

    const orderId = req.query.vnp_TxnRef;
    const responseCode = req.query.vnp_ResponseCode;
    const existingOrder = await orderService.getOrderById(orderId);
    const callbackRecord = await paymentService.recordVnpayCallback({
      query: req.query,
      order: existingOrder,
      signatureValid: true
    });

    if (callbackRecord.duplicate) {
      if (callbackRecord.payment.status === 'PAID') {
        return redirectToPaymentResult(res, {
          status: 'success',
          orderId,
          responseCode: callbackRecord.payment.responseCode || responseCode,
          message: 'Payment already confirmed'
        });
      }

      return redirectToPaymentResult(res, {
        status: 'failed',
        orderId,
        responseCode: callbackRecord.payment.responseCode,
        message: 'Payment was already processed as failed'
      });
    }

    if (responseCode !== '00') {
      await orderService.markOrderFailed(orderId, {
        transactionRef: req.query.vnp_TransactionNo,
        vnpResponseCode: responseCode,
        rawCallback: req.query
      });

      return redirectToPaymentResult(res, {
        status: 'failed',
        orderId,
        responseCode,
        message: 'Payment failed'
      });
    }

    const order = await orderService.markOrderPaid(orderId, {
      transactionRef: req.query.vnp_TransactionNo,
      vnpResponseCode: responseCode,
      rawCallback: req.query
    });

    return redirectToPaymentResult(res, {
      status: 'success',
      orderId: order._id,
      responseCode,
      message: 'Payment confirmed'
    });
  } catch (error) {
    if (error.message === 'ORDER_CANCELLED' || error.message === 'ORDER_EXPIRED') {
      return redirectToPaymentResult(res, {
        status: 'failed',
        orderId: req.query.vnp_TxnRef,
        responseCode: req.query.vnp_ResponseCode,
        message: 'Order was cancelled because payment was not completed within 30 minutes'
      });
    }
    console.error(error);
    return redirectToPaymentResult(res, {
      status: 'failed',
      orderId: req.query.vnp_TxnRef,
      responseCode: req.query.vnp_ResponseCode,
      message: 'Payment verification failed'
    });
  }
};

module.exports = {
  previewPayment,
  createPayment,
  handleVnpayReturn
};





