import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { genShortened, getURL,fetchCommonLinks } from "./controllers/linkController.js";

const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

try {
  mongoose.connect(process.env.MONGO_URI);
  console.log("Database connected!");
} catch (err) {
  console.log("Error on connecting database!");
}

app.post("/api/shorten", genShortened);
app.get("/:short_code", getURL);
app.post("/links", fetchCommonLinks);

const PORT = 1234;

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
