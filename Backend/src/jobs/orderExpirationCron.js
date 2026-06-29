const cron = require('node-cron');
const orderService = require('../service/orderService');

cron.schedule('* * * * *', async () => {
  try {
    const cancelledOrders = await orderService.cancelExpiredPendingOrders();
    if (cancelledOrders.length) {
      console.log(`[ORDER CRON] Cancelled expired pending orders: ${cancelledOrders.length}`);
    }
  } catch (error) {
    console.error('[ORDER CRON ERROR]', error);
  }
});
