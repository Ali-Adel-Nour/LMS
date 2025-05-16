const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'redis://localhost:6379',
  port: process.env.REDIS_PORT || 6379,
  socket: { reconnectStrategy: () => 1000 }
});
// const client = redis.createClient({
//   url: process.env.REDIS_URL || 'redis://redis:6379',
//   socket: { reconnectStrategy: () => 1000 }
// });
// Connect handling
const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log('Redis Connected');
    }
    return client;
  } catch (error) {
    console.error('Redis Connection Error:', error);
    throw error;
  }
};

// Check connection status
const getRedisClient = async () => {
  if (!client.isOpen) {
    await connectRedis();

  }
  return client;
};

module.exports = { client, connectRedis, getRedisClient };