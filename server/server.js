import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import rateLimit from "express-rate-limit";
import {
  genShortened,
  getURL,
  fetchCommonLinks,
} from "./controllers/linkController.js";

dotenv.config();

const app = express();

// ✅ Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) return new Error('Redis connection failed');
      return Math.min(retries * 500, 3000);
    },
  },
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
redisClient.on('connect', () => console.log('🔄 Connecting to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis ready'));

// ✅ Connect to Redis
await redisClient.connect();

// ✅ For rate-limit-redis v5.x - use sendCommand
const redisStore = new RedisStore({
  sendCommand: (...args) => {
    console.log('Redis command:', args[0]); // Debug
    return redisClient.sendCommand(args);
  },
  prefix: 'rl:',
});

const generalLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

const trimLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many trims! Wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

app.use(generalLimiter);
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log("Database connection error:", err.message));

app.post("/api/shorten", trimLimiter, genShortened);
app.post("/links", fetchCommonLinks);

app.get("/api/status", async (req, res) => {
  try {
    await redisClient.ping();
    const info = await redisClient.info('server');
    const match = info.match(/redis_version:(\d+\.\d+\.\d+)/);
    res.json({ 
      redis: "connected",
      redisVersion: match ? match[1] : 'unknown',
      database: "connected", 
      server: "running"
    });
  } catch (err) {
    res.json({ 
      redis: "disconnected",
      database: "connected", 
      server: "running",
      error: err.message
    });
  }
});

app.get("/api/rate-limit-status", async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const trimKey = `rl:trim:${ip}`;
    const generalKey = `rl:general:${ip}`;
    
    const [trimCount, generalCount, trimTTL, generalTTL] = await Promise.all([
      redisClient.get(trimKey).catch(() => null),
      redisClient.get(generalKey).catch(() => null),
      redisClient.ttl(trimKey).catch(() => 60),
      redisClient.ttl(generalKey).catch(() => 900),
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

app.get("/:short_code", getURL);

const PORT = process.env.PORT || 1234;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});






