const { isRedisReady } = require('../config/redis');

const getHealth = (req, res) => {
  return res.status(200).json({
    status: 'OK',
    services: {
      redis: isRedisReady() ? 'UP' : 'FALLBACK'
    }
  });
};

module.exports = {
  getHealth
};
