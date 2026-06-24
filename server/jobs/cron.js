// jobs/cron.js
import Link from "../models/Link.js";
import redisClient from "../config/redis.js"; // Shared instance!

const processQueue = async () => {
  console.log("⏰ Cron: Processing Redis Queue...");

  const keys = await redisClient.keys("queue:*");

  for (const key of keys) {
    const short_code = key.split(":")[1];
    const clickCount = await redisClient.get(`clicks:${short_code}`);
    if (!clickCount) continue;

    const analytics = await redisClient.lrange(key, 0, -1);

    // Safe parsing
    const parsedAnalytics = analytics
      .map((a) => {
        try {
          return JSON.parse(a);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    try {
      await Link.updateOne(
        { short_code },
        {
          $inc: { clicks: parseInt(clickCount) },
          $push: { analytics: { $each: parsedAnalytics } },
        },
      );

      // Only delete if DB update succeeded
      await redisClient.del(`clicks:${short_code}`);
      await redisClient.del(key);

      console.log(`✅ Updated ${short_code}: +${clickCount} clicks`);
    } catch (error) {
      console.error(`❌ Failed to update ${short_code}:`, error.message);
    }
  }
};

export default processQueue;
