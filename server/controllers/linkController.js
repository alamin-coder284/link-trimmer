import Link from "../models/Link.js";
import { nanoid } from "nanoid";

const genShortened = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(404).json({ message: "No URL found!" });
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

    const linkDoc = await Link.findOne({ short_code: short_code });

    if (!linkDoc) {
      return res.status(404).status({ message: "Link not found!" });
    }

    linkDoc.clicks += 1;
    await linkDoc.save();

    res.redirect(301, linkDoc.original_url);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { genShortened, getURL };
