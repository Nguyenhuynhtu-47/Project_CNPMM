const { createClient } = require('redis');

let client;
let connectingPromise;
let disabled = false;

const getRedisUrl = () => process.env.REDIS_URL || 'redis://localhost:6379';

const getRedisClient = () => {
  if (disabled) return null;

  if (!client) {
    client = createClient({
      url: getRedisUrl(),
      socket: {
        reconnectStrategy: false
      }
    });

    client.on('error', (error) => {
      disabled = true;
      console.warn('Redis unavailable, using database fallback:', error.message);
    });
  }

  return client;
};

const connectRedis = async () => {
  const redisClient = getRedisClient();
  if (!redisClient) return null;

  if (redisClient.isOpen) return redisClient;
  if (connectingPromise) return connectingPromise;

  connectingPromise = redisClient.connect()
    .then(() => redisClient)
    .catch((error) => {
      disabled = true;
      console.warn('Redis connection failed, using database fallback:', error.message);
      return null;
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
};

const isRedisReady = () => Boolean(client?.isOpen && !disabled);

const closeRedis = async () => {
  if (client?.isOpen) {
    await client.quit();
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisReady,
  closeRedis
};