import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) return new Error('Redis connection failed');
      return Math.min(retries * 500, 3000);
    },
    connectTimeout: 10000,
  },
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
redisClient.on('connect', () => console.log('🔄 Connecting to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis ready'));

// ✅ Connect and export
await redisClient.connect();

export default redisClient;






