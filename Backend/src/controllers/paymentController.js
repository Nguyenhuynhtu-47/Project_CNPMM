const paymentService = require('../service/paymentService');
const orderService = require('../service/orderService');

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
    const couponErrors = {
      COUPON_NOT_FOUND: 'Coupon not found',
      COUPON_INACTIVE: 'Coupon is inactive or expired',
      COUPON_USAGE_LIMIT: 'Coupon usage limit reached',
      COUPON_USER_LIMIT: 'You already used this coupon',
      COUPON_MIN_ORDER: 'Order amount does not meet coupon minimum'
    };
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
      return res.status(400).json({ message: 'Invalid payment signature' });
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
        return res.status(200).json({
          message: 'Payment callback already processed',
          order: existingOrder
        });
      }

      return res.status(400).json({
        message: 'Payment callback already processed as failed',
        responseCode: callbackRecord.payment.responseCode
      });
    }

    if (responseCode !== '00') {
      await orderService.markOrderFailed(orderId, {
        transactionRef: req.query.vnp_TransactionNo,
        vnpResponseCode: responseCode,
        rawCallback: req.query
      });

      return res.status(400).json({
        message: 'Payment failed',
        responseCode
      });
    }

    const order = await orderService.markOrderPaid(orderId, {
      transactionRef: req.query.vnp_TransactionNo,
      vnpResponseCode: responseCode,
      rawCallback: req.query
    });

    return res.status(200).json({
      message: 'Payment confirmed',
      order
    });
  } catch (error) {
    if (error.message === 'ORDER_CANCELLED' || error.message === 'ORDER_EXPIRED') {
      return res.status(400).json({ message: 'Order was cancelled because payment was not completed within 30 minutes' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Payment verification failed' });
  }
};

module.exports = {
  createPayment,
  handleVnpayReturn
};
