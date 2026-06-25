import mongoose from "mongoose";

const linkSchema = new mongoose.Schema({
  short_code: String,
  original_url: String,
  clicks: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  analytics: [
    {
      country: String,
      device: String,
      browser: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  password: { type: String, default: null },
});


// TTL Index – MongoDB auto-deletes when expiresAt is reached
linkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
  
const Link = mongoose.model("Link", linkSchema);

export default Link;
