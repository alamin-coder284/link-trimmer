import mongoose from "mongoose";

const linkSchema = new mongoose.Schema({
  short_code: String,
  original_url: String,
  clicks: { type: Number, default: 0 },
  analytics: [{
    country: String,
    device: String,
    browser: String,
    timestamp: { type: Date, default: Date.now }
  }]
});
const Link = mongoose.model("Link", linkSchema);

export default Link;
