import Link from "../models/Link.js";
import { nanoid } from "nanoid";
import { UAParser } from "ua-parser-js";
import redisClient from "../config/redis.js";

const genShortened = async (req, res) => {
  try {
    const { url, password } = req.body;

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
      password: password || null,
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

// get directed with your code

const getURL = async (req, res) => {
  const getPasswordForm = (shortCode, error = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>zip9 :: Password Required</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .container {
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 30px rgba(203,56,55,0.1);
    }
    .logo {
      font-size: 1.8rem;
      font-weight: bold;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .logo span { color: #CB3837; }
    .subtitle {
      font-size: 0.75rem;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    .lock-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 1rem;
      font-weight: normal;
      margin-bottom: 1.5rem;
      color: #aaa;
    }
    .short-code {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 0.3rem 0.8rem;
      font-family: monospace;
      font-size: 0.9rem;
      color: #CB3837;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    input {
      background: #0d0d0d;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 0.8rem 1rem;
      color: #fff;
      font-family: monospace;
      font-size: 0.9rem;
      outline: none;
      transition: border 0.2s;
    }
    input:focus {
      border-color: #CB3837;
      box-shadow: 0 0 8px rgba(203,56,55,0.2);
    }
    button {
      background: #CB3837;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.8rem;
      font-family: monospace;
      font-weight: bold;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      letter-spacing: 1px;
    }
    button:hover {
      background: #b02e2d;
      transform: translateY(-1px);
    }
    .error {
      color: #ff6b6b;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      min-height: 1.2rem;
    }
    .footer {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #444;
    }
    .footer a { color: #666; text-decoration: none; }
    .footer a:hover { color: #CB3837; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">zip<span>_</span>9</div>
    <div class="subtitle">illuminated inkwell</div>
    <div class="lock-icon">🔐</div>
    <h2>This link is password‑protected</h2>
    <div class="short-code">zip9.gt.tc/${shortCode}</div>
    
    <form method="POST" action="/${shortCode}">
      <input type="password" name="pwd" placeholder="Enter password..." autofocus required>
      ${error ? `<div class="error">${error}</div>` : ""}
      <button type="submit">Unlock →</button>
    </form>
    
    <div class="footer">
      Powered by <a href="https://zip9.gt.tc" target="_blank">zip9</a>
    </div>
  </div>
</body>
</html>
`;

  try {
    const { short_code } = req.params;

    // STEP 1: Redis Cache চেক করো আগে - Core Layer 1
    const cachedUrl = await redisClient.get(short_code);

    if (cachedUrl) {
      console.log(`⚡ Cache HIT for ${short_code} - 1ms Redirect`);

      // STEP 4: Analytics এর কাজ আগের মতোই
      const ua = new UAParser(req.headers["user-agent"]);
      const device = ua.getDevice().type || "desktop";
      const browser = ua.getBrowser().name || "unknown";

      let country = "unknown";
      try {
        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoRes.json();
        country = geoData.country || "unknown";
      } catch (err) {}

      // Redis Queue তে Click জমাও - DB Touch করবা না
      try {
        await redisClient.incr(`clicks:${short_code}`);
        await redisClient.lPush(
          `queue:${short_code}`,
          JSON.stringify({ country, device, browser, ts: Date.now() }),
        );
        console.log(`📝 Queued click for ${short_code}`);
      } catch (err) {
        console.log("Queued failed: " + err.message);
      }

      const linkDoc = await Link.findOne({ short_code }, "password");

      if (linkDoc.password && linkDoc.password !== pwd) {
        const error = pwd ? "Incorrect password" : "";
        return res.status(401).send(getPasswordForm(short_code, error));
      }

      return res.redirect(302, cachedUrl);
    }

    console.log(`💾 Cache MISS for ${short_code} - MongoDB Query`);

    // STEP 2: Cache এ নাই। MongoDB থেকে আনো
    const linkDoc = await Link.findOne({ short_code });

    if (!linkDoc) {
      return res.status(404).json({ message: "Link not found!" });
    }
    if (linkDoc.password) {
      if (!pwd || linkDoc.password !== pwd) {
        const error = pwd ? "Incorrect password" : "";
        return res.status(401).send(getPasswordForm(short_code, error));
      }
    }

    // STEP 3: MongoDB থেকে পাইছো। Redis এ Save করো 1 ঘন্টার জন্য
    await redisClient.set(short_code, linkDoc.original_url, { EX: 3600 });
    console.log(`💾 Saved ${short_code} to Redis Cache for 1 hour`);

    // STEP 5: Redirect
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
    res.json({
      redis: "disconnected",
      database: "connected",
      server: "running",
    });
  }
};

export { genShortened, getURL, fetchCommonLinks, getStatus };
