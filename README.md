# zip9 — Trim Your Links, Keep Your Sanity

A URL shortener I built from scratch because long links are ugly and life is too short. Frontend on Vercel, backend on Render, MongoDB for storage, Redis for keeping abusers in check. Dark theme, terminal vibes, npm-red accents — because developers deserve beautiful tools.

---

## What It Does

- You paste a long URL. It gives you a short one. Simple.
- Every click gets tracked — country, device, browser. Not in a creepy way. In a "wow, someone from Germany clicked my link" way.
- Rate limited with Redis. 10 trims per minute. Try harder, bots.
- Your links stay in localStorage. Refresh, close tab, come back tomorrow — they're still there.
- Duplicate URL? Backend catches it. No wasted database rows.
- MongoDB sleeping? Loading skeleton keeps you company while it wakes up.

---

## Live Stuff

| Thing | Where |
|-------|-------|
| Frontend | vercel |
| Backend | render |
| Short links | zip9.gt.tc/your-code |

---

## Stack

React on the front. Express on the back. MongoDB Atlas for data. Redis Cloud for rate limiting. Tailwind CSS because writing raw CSS in 2026 is a sin. Lucide icons for the pretty parts. FontAwesome for the nostalgic parts.

No Next.js. No TypeScript. No overengineering. Just things that work.

---

## How It Flows

User hits the frontend → trims a URL → backend creates a short code → saves to MongoDB → returns it → frontend shows a green toast like "Link trimmed!" → user copies it → someone clicks it → backend increments counter → analytics appear like magic.

In between all that, Redis sits there counting requests per IP. You cross the limit, you get a polite "Too many trims!" message. Wait a minute, try again.

---

## Edge Cases I Actually Thought About

Because crashing is embarrassing.

- **Invalid short code?** Redirects to home. No broken pages.
- **MongoDB cold start?** Spinner + "Waking up database..." message. Patience, brother.
- **Rate limited?** Red tooltip. Redis remembers even after server restart.
- **Duplicate URL?** Server says "I've seen this before" and returns the existing code.
- **Empty input?** Validation stops you. No undefined nonsense.
- **localStorage mess?** Merge strategy. Deletes don't come back on refresh.
- **Browser caches redirect?** 302 status. Every click hits the server. Counts stay real.