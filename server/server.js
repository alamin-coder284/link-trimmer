import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClient } from 'redis';
import { redisRateLimiter } from "./middleware/rateLimiter.js";
import { genShortened, getURL, fetchCommonLinks } from "./controllers/linkController.js";

dotenv.config();

const app = express();

// Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis error:', err.message));

await redisClient.connect();
console.log('Redis connected!');

// Rate limiters using YOUR custom middleware (no Lua scripts)
const generalLimiter = redisRateLimiter(15 * 60 * 1000, 100, "general");
const trimLimiter = redisRateLimiter(60 * 1000, 10, "trim");

app.use(generalLimiter);
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected!"))
  .catch(err => console.log("Database connection error:", err.message));

app.post("/api/shorten", trimLimiter, genShortened);
app.post("/links", fetchCommonLinks);
app.get("/:short_code", getURL);

app.get("/api/status", async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ redis: "connected", database: "connected", server: "running" });
  } catch (err) {
    res.json({ redis: "disconnected", database: "connected", server: "running" });
  }
});

app.get("/api/rate-limit-status", async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const trimKey = `trim:${ip}`;
    const generalKey = `general:${ip}`;
    
    const [trimCount, generalCount, trimTTL, generalTTL] = await Promise.all([
      redisClient.get(trimKey),
      redisClient.get(generalKey),
      redisClient.ttl(trimKey),
      redisClient.ttl(generalKey),
    ]);
    
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

const PORT = process.env.PORT || 1234;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});






