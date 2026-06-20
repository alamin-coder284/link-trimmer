import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { genShortened, getURL, fetchCommonLinks } from "./controllers/linkController.js";

dotenv.config();

const app = express();

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const trimLimiter = rateLimit({
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected!"))
  .catch(err => console.log("Database connection error:", err.message));

// Apply strict limiter ONLY to the shorten endpoint
app.post("/api/shorten", trimLimiter, genShortened);
app.get("/:short_code", getURL);
app.post("/links", fetchCommonLinks);

const PORT = 1234;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});