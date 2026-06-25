# zip9 — Trim Your Links, Keep Your Sanity

A URL shortener I built from scratch because long links are ugly and life is too short. Frontend on Vercel, backend on Render, MongoDB for storage, Redis for keeping abusers in check. Dark theme, terminal vibes, npm-red accents — because developers deserve beautiful tools.

---

## What It Does

- You paste a long URL. It gives you a short one. Simple.
- Every click gets tracked — country, device, browser. Not in a creepy way. In a "wow, someone from Germany clicked my link" way.
- Rate limited with Redis. 10 trims per minute, 100 requests per 15 minutes. Try harder, bots.
- Your links stay in localStorage. Refresh, close tab, come back tomorrow — they're still there.
- Duplicate URL? Backend catches it. No wasted database rows.
- MongoDB sleeping? Loading skeleton keeps you company while it wakes up.
- Password protect your links. Only people with the password can access them.
- Auto-expiring links. Set it and forget it. MongoDB TTL index handles the cleanup.
- Real-time rate limit indicator. You see exactly how many trims you have left.
- Redis health badge on the dashboard. You know the cache layer is alive.

---

## Live Stuff

| Thing       | Where                   |
| ----------- | ----------------------- |
| Frontend    | Vercel                  |
| Backend     | Render                  |
| Short links | zip9.gt.tc/your-code    |
| Redis       | Redis Cloud (free tier) |
| Database    | MongoDB Atlas           |

---

## Stack

React on the front. Express on the back. MongoDB Atlas for data. Redis Cloud for rate limiting. Tailwind CSS because writing raw CSS in 2026 is a sin. Lucide icons for the pretty parts. FontAwesome for the nostalgic parts. ua-parser-js for device detection. ip-api for geolocation.

No Next.js. No TypeScript. No overengineering. Just things that work.

---

## How It Flows

User hits the frontend → pastes a URL → optionally clicks the lock icon to set a password → picks an expiry time → clicks Trim → backend checks for duplicates → creates a short code → saves to MongoDB with optional password and expiry → returns it → frontend shows a green toast like "Link trimmed!" or "Already exists!" → dashboard updates instantly → someone clicks the short link → Redis cache checks first → if cached, redirects in 1ms → if not, queries MongoDB, caches for 1 hour → analytics captured (country, device, browser) → click count increments in Redis queue → password-protected links show a dark themed HTML form → correct password redirects, wrong password shows error.

In between all that, Redis sits there counting requests per IP. You cross the limit, you get a polite "Too many trims!" message with a countdown timer. Wait it out, try again. The dashboard shows "Redis online" with a pulsing green dot and a rate limit badge.

Every 5 minutes, click counts sync from Redis to MongoDB. Links auto-delete when their expiry time hits — no cron jobs, no cleanup scripts, pure MongoDB TTL magic.

---

## Features Deep Dive

### Password Protection

- Toggle the lock button next to Trim URL
- Set any password you want
- Backend serves a custom dark-themed HTML form for protected links
- Wrong password? Red error message, try again
- Correct password? Instant redirect to the destination
- Protected links show a lock icon in the dashboard

### Link Expiration

- Preset options: Never, 1 Hour, 24 Hours, 7 Days, 30 Days
- Backend sets `expiresAt` field
- MongoDB TTL index auto-deletes expired documents
- Expired links redirect to home with "Link not found"
- Dashboard shows expiry date with an hourglass icon

### Rate Limiting

- Custom Redis-backed rate limiter — no Lua scripts needed
- Survives server restarts (unlike in-memory limiters)
- Frontend shows remaining trims with color-coded indicator
- Green dot: plenty left. Yellow: running low. Red: blocked.
- Shows countdown timer until reset
- Rate limit status endpoint for transparency

### Analytics

- Country detection via IP geolocation
- Device type: desktop, mobile, tablet
- Browser detection
- Expandable panel on each link card in dashboard
- Top countries with flag emojis
- Device breakdown with icons
- Recent activity feed with timestamps

### UI/UX

- Loading skeleton while MongoDB wakes from cold start
- "Waking up database..." message with spinning animation
- Success toast with animated checkmark
- Error tooltip under input with red glow
- Revolving border animation during API call
- Copy button with "Copied!" confirmation
- Delete button with instant local update
- Empty state with helpful message
- Fully responsive — works on phone, tablet, desktop

---

## Edge Cases I Actually Thought About

Because crashing is embarrassing.

- **Invalid short code?** Redirects to home. No broken pages. Checks via API before redirecting.
- **MongoDB cold start?** Spinner + "Waking up database..." message. Patience, brother.
- **Rate limited?** Red tooltip with countdown. Redis remembers even after server restart.
- **Duplicate URL?** Server says "I've seen this before" and returns the existing code. Frontend shows "Already exists!" toast. No duplicate in localStorage.
- **Empty input?** Validation stops you. Can't submit `http://` alone. No undefined nonsense.
- **localStorage mess?** Merge strategy on sync. Deletes don't come back on refresh. First-time user gets default links, then replaced on first trim.
- **Browser caches redirect?** 302 status, not 301. Every click hits the server. Counts stay real.
- **`undefined` short codes?** Dashboard filters them out. Shows "Waking up database..." instead of broken links.
- **Rate limit keys stuck?** TTL set properly now. Keys auto-expire after their window.
- **Redis free tier blocks Lua?** Built custom limiter with plain SET/GET/INCR commands. Works on free tier.
- **Cross-origin redirect check?** Used `/links` API to validate short codes instead of opaque fetch responses.
- **Password form not working?** Added `express.urlencoded` to parse form submissions. Added POST route alongside GET.
- **Chain icon jumping?** Changed from `inset-y-0` to `top-4` so it stays put when password input appears.
- **Click count stuck?** Changed from 301 to 302 redirect. No more browser caching the redirect.
- **Delete comes back on refresh?** Fixed sync logic. User-trimmed links skip initial server sync, trust localStorage.

---

## API Endpoints

| Method | Route                      | What It Does                     |
| ------ | -------------------------- | -------------------------------- |
| POST   | /api/shorten               | Creates short link               |
| GET    | /:short_code               | Redirects to original URL        |
| POST   | /:short_code               | Handles password form submission |
| POST   | /links                     | Fetches links by codes array     |
| GET    | /api/analytics/:short_code | Click analytics for a link       |
| GET    | /api/rate-limit-status     | Your current rate limit status   |
| GET    | /api/status                | Redis + DB health check          |
