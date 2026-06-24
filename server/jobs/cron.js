import Link from "../models/Link.js";
import redisClient from "../config/redis.js";

const processQueue = async () => {
  console.log("⏰ Cron: Processing Redis Queue...");
  
  // Redis থেকে সব Short Code এর List আনো - SCAN ইউজ করবো
  const keys = await redisClient.keys('queue:*');
  
  for (const key of keys) {
    const short_code = key.split(':')[1];
    
    // 1. Click Count নাও
    const clickCount = await redisClient.get(`clicks:${short_code}`);
    if (!clickCount) continue;
    
    // 2. সব Analytics টানো Queue থেকে
    const analytics = await redisClient.lrange(key, 0, -1);
    
    // 3. MongoDB তে Batch Update - $inc + $push
    await Link.updateOne(
      { short_code },
      { 
        $inc: { clicks: parseInt(clickCount) },
        $push: { analytics: { $each: analytics.map(a => JSON.parse(a)) } }
      }
    );
    
    // 4. Redis Queue খালি করো
    await redisClient.del(`clicks:${short_code}`);
    await redisClient.del(key);
    
    console.log(`✅ Updated ${short_code}: +${clickCount} clicks`);
  }
};

export default processQueue;










