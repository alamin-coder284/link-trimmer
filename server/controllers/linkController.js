import Link from "../models/Link.js";
import { nanoid } from "nanoid";
import {UAParser} from "ua-parser-js";
import redisClient from "../config/redis.js";


const genShortened = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(404).json({ message: "No URL found!" });
    }
     
     
    // Check for duplicate
    const existingLink = await Link.findOne({ original_url: url });
    if (existingLink) {
      return res.status(200).json({
        short_code: existingLink.short_code,
        original_url: existingLink.original_url,
        clicks: existingLink.clicks,
        message: "URL already shortened",
      });
    }
    
    
    
    
    const shortCode = nanoid(7);

    const newLink = new Link({
      short_code: shortCode,
      original_url: url,
      clicks: 0,
    });

    await newLink.save();

    res.status(201).json({
      short_code: shortCode,
      original_url: url,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




const getURL = async (req, res) => {
  try {
    const { short_code } = req.params;

    // STEP 1: Redis Cache চেক করো আগে - Core Layer 1
    const cachedUrl = await redisClient.get(short_code);
    
    if (cachedUrl) {
      console.log(`⚡ Cache HIT for ${short_code} - 1ms Redirect`);
      
      
      // STEP 4: Analytics এর কাজ আগের মতোই
    const ua = new UAParser(req.headers['user-agent']);
    const device = ua.getDevice().type || 'desktop';
    const browser = ua.getBrowser().name || 'unknown';

    let country = 'unknown';
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      country = geoData.country || 'unknown';
    } catch (err) {}

    /* commented for incr, lpush
    linkDoc.analytics.push({ country, device, browser });
    linkDoc.clicks += 1;
    await linkDoc.save();
    */

    // Redis Queue তে Click জমাও - DB Touch করবা না
   await redisClient.incr(`clicks:${short_code}`);
   await redisClient.lpush(`queue:${short_code}`, JSON.stringify({ country, device, browser, ts: Date.now() }));
console.log(`📝 Queued click for ${short_code}`);

      
      
      
      return res.redirect(302, cachedUrl);
    }

    console.log(`💾 Cache MISS for ${short_code} - MongoDB Query`);

    // STEP 2: Cache এ নাই। MongoDB থেকে আনো
    const linkDoc = await Link.findOne({ short_code });

    if (!linkDoc) {
      return res.status(404).json({ message: "Link not found!" });
    }

    // STEP 3: MongoDB থেকে পাইছো। Redis এ Save করো 1 ঘন্টার জন্য
    await redisClient.set(short_code, linkDoc.original_url, { EX: 3600 });
    console.log(`💾 Saved ${short_code} to Redis Cache for 1 hour`);


    // STEP 5: Redirect
    res.redirect(302, linkDoc.original_url);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};






const fetchCommonLinks = async (req, res) => {
  try {
    const targetCodes = req.body.codes;

    // If no codes are sent, use a default fallback
    const codesToFetch = targetCodes || ["f2KyylN", "25hozRT", "elh12MG"];

    const links = await Link.find({ short_code: { $in: codesToFetch } });

    res.status(200).json(links);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getStatus = async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ redis: "connected", database: "connected", server: "running" });
  } catch (err) {
    res.json({ redis: "disconnected", database: "connected", server: "running" });
  }

}



export { genShortened, getURL, fetchCommonLinks 
, getStatus};
