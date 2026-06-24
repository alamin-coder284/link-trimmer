import redisClient from "../config/redis.js";

export const redisRateLimiter = (windowMs, maxRequests, keyPrefix) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const key = `${keyPrefix}:${ip}`;

      const current = await redisClient.get(key);

      if (current === null) {
        await redisClient.set(key, 1, { EX: Math.ceil(windowMs / 1000) });
        return next();
      }

      const count = parseInt(current);

      if (count >= maxRequests) {
        return res.status(429).json({
          message: "Too many requests. Please slow down, like a calm prayer."
        });
      }

      await redisClient.incr(key);
      next();
    } catch (err) {
      console.log("Rate limiter error:", err.message);
      next();
    }
  };
};