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

    const linkDoc = await Link.findOne({ short_code });

    if (!linkDoc) {
      return res.status(404).json({ message: "Link not found!" });
    }

    // Parse device info
    const ua = new UAParser(req.headers['user-agent']);
    const device = ua.getDevice().type || 'desktop';
    const browser = ua.getBrowser().name || 'unknown';

    // Get country from IP (free API)
    let country = 'unknown';
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      country = geoData.country || 'unknown';
    } catch (err) {
      // Silently fail — country is bonus, not critical
    }

    // Save analytics
    linkDoc.analytics.push({ country, device, browser });
    linkDoc.clicks += 1;
    await linkDoc.save();

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
