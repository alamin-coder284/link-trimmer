import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    short_code: {
      type: String,
      required: true,
      min: 6,
      unique: true,
    },
    original_url: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Link = mongoose.model("Link", linkSchema);

export default Link;
