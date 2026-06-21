import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import RedisStore from 'rate-limit-redis';
import redisClient from "./config/redis.js";
import rateLimit from "express-rate-limit";
import {
  genShortened,
  getURL,
  fetchCommonLinks,
} from "./controllers/linkController.js";

dotenv.config();

const app = express();

// Rate limiters
const generalLimiter = rateLimit({
  store: new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const trimLimiter = rateLimit({
  store: new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(...args),
  }),
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many trims! Wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to ALL routes
app.use(generalLimiter);

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log("Database connection error:", err.message));

// Apply strict limiter ONLY to the shorten endpoint
app.post("/api/shorten", trimLimiter, genShortened);
app.post("/links", fetchCommonLinks);
app.get("/api/status", async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ 
      redis: "connected",
      database: "connected",
      server: "running"
    });
  } catch (err) {
    res.json({ 
      redis: "disconnected",
      database: "connected", 
      server: "running"
    });
  }
});
app.get("/api/rate-limit-status", async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const trimKey = `trim:${ip}`;
    const generalKey = `general:${ip}`;
    
    const trimCount = await redisClient.get(trimKey);
    const generalCount = await redisClient.get(generalKey);
    
    // Get TTL (how many seconds until reset)
    const trimTTL = await redisClient.ttl(trimKey);
    const generalTTL = await redisClient.ttl(generalKey);
    
    res.json({
      trim: {
        used: parseInt(trimCount) || 0,
        limit: 10,
        remaining: 10 - (parseInt(trimCount) || 0),
        resetIn: trimTTL > 0 ? trimTTL : 60,
      },
      general: {
        used: parseInt(generalCount) || 0,
        limit: 100,
        remaining: 100 - (parseInt(generalCount) || 0),
        resetIn: generalTTL > 0 ? generalTTL : 900,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch limits" });
  }
});

app.get("/:short_code", getURL);

const PORT = 1234;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
