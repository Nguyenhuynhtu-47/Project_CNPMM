const { toObject } = require('./commonDto');

const toOrderResponse = (order) => {
  const item = toObject(order);
  if (!item) return null;

  return {
    _id: item._id,
    user: item.user,
    course: item.course,
    class: item.class,
    amount: item.amount,
    currency: item.currency,
    status: item.status,
    paymentMethod: item.paymentMethod,
    providerData: item.providerData,
    transactionRef: item.transactionRef,
    expiresAt: item.expiresAt,
    cancelledAt: item.cancelledAt,
    cancelReason: item.cancelReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
};

module.exports = {
  toOrderResponse
};
