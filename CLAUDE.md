# CLAUDE.md — $NUT Casino Website

> Read this entire file before touching anything. It is the ground truth.

---

## Project Identity

**$NUT** is a Solana memecoin whose gimmick is tracking how many nuts the community logs.
Live site: https://nutcoin-alpha.vercel.app
GitHub: MysteriousSativa/nutcoin
Auto-deploys to Vercel on every push to `main`.

---

## Absolute Rules (violations block any merge)

1. **Never push directly to `main`.** Always branch, always PR.
2. Branch naming: `auto/YYYY-MM-DD-HHmm-short-description`
3. **Never merge a PR without human review.** Open it, stop, leave notes.
4. Never commit `.env`, Supabase service_role keys, or any secrets.
5. Never rename `deed_date` or `created_at` in the Supabase schema.
6. Never re-add `nut-logo.png`.
7. Never use hyphens or em dashes in any user-visible text on the website. They are obvious AI tells. Use spaces or colons instead.
8. Never use `mix-blend-mode: screen`, `background-attachment: fixed`, goo/SVG filters, or heavy `backdrop-filter blur()` above 8px.
9. Never use PNG images as interactive UI buttons.
10. When uncertain about a production change, stop and document the uncertainty in the PR description. Do not guess.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (zero framework) |
| Hosting | Vercel (free tier, auto-deploy from GitHub main) |
| Database | Supabase (PostgreSQL) |
| WS Server | Node.js + `ws` library on Render.com free tier |
| Fonts | Inter (UI), Space Mono (numbers) via Google Fonts |

---

## File Map

```
index.html          Main landing page. Nut logging, leaderboard,
                    DexScreener chart, Twitter embed, casino entry point.
casino-app.html     Casino iframe container. Tabs: Wheel, Flip, Crash,
                    21, Poker, Slope, Live.
crash-live.html     Multiplayer crash game (WebSocket client).
poker-live.html     Texas Hold'em multiplayer (WebSocket client).
nutslope.html       Slope/ball-drop game (self-contained).
nutkens.js          NUTTOKEN conversion layer. Reads from localStorage
                    key nut_pm_bal_v1. 1 nut = 1000 NUTTOKENS.

casino.js           Legacy casino helper (may have dead functions).
casino-live.js      Legacy live feed helper (may be partially used).
blackjack.js        Standalone blackjack module (check if imported).
addons.js           Misc addons (check usage).
allocation.js       Token allocation display.
predictor.js        Oracle/prediction features.
dream.js            Unknown; audit before touching.
drop.js             Unknown; audit before touching.
chaos.js            Unknown; audit before touching.
quirks.js           Unknown; audit before touching.
profiles.js         User profiles module.
npcs.js             NPC logic for games.
chart.js            Charting helper.
buycta.js           Buy CTA buttons.

server/index.js     WebSocket server. Handles /  (crash) and /poker.
server/package.json Requires only `ws` library.
vercel.json         CSP headers for all routes. Critical: any new external
                    origin must be added here or it will be blocked.
```

---

## Casino Architecture

The casino loads as a full-screen iframe overlay on `index.html`.

```
index.html
  └─ #casinoAppOverlay (position: fixed, z-index: 9999)
       └─ #casinoAppFrame (iframe src="./casino-app.html")
            └─ casino-app.html
                 ├─ panel_wheel   (canvas)
                 ├─ panel_flip    (canvas)
                 ├─ panel_crash   (canvas, solo)
                 ├─ panel_bj      (DOM blackjack)
                 ├─ panel_poker   (iframe: poker-live.html)
                 ├─ panel_slope   (iframe: nutslope.html)
                 └─ panel_live    (iframe: crash-live.html)
```

**postMessage protocol between layers:**
- Child → Parent: `{type:'casino:balance', balance:N}` to sync chips
- Child → Parent: `{type:'casino:close'}` to close the overlay
- Child → Parent: `{type:'poker:close'}`, `{type:'live:close'}`, `{type:'slope:close'}`
- Parent → Child: `{type:'casino:goto', tab:'poker'}` to deep-link a tab

**Deep-link opening:** `NutKens.openCasino('poker')` in `nutkens.js` opens the casino to a specific tab via URL hash or postMessage.

---

## WebSocket Server

URL base: `wss://nutcrash-server.onrender.com`
- `/` or no path → crash game loop
- `/poker` → Texas Hold'em game loop

**Render free tier warning:** The server sleeps after 15 minutes with no connections. First connection after sleep takes 30 to 60 seconds. The crash-live.html and poker-live.html clients reconnect automatically.

The server lives in `server/index.js`. Changes there require a Render redeploy (auto if Render is connected to GitHub).

---

## Supabase

Project ID: `ynzbwnlltqrprnrlbtna`
Public anon key is in `index.html` (safe to commit, has RLS).
Service role key: NEVER commit, never use in client code.

Table: `nut_logs` with immutable columns `deed_date` and `created_at`.
RPC: `log_nut`, `recent_activity`, `live_community_feed`, `casino_watchlist`.

---

## CSP (vercel.json) — Current Allowlist

Any new external resource (script, image, font, frame, WebSocket) must be added here:

```
script-src:  cdn.jsdelivr.net  unpkg.com
style-src:   fonts.googleapis.com
font-src:    fonts.gstatic.com
img-src:     pbs.twimg.com  abs.twimg.com  syndication.twitter.com
             *.twimg.com  api.dicebear.com  deckofcardsapi.com
connect-src: *.supabase.co  wss://*.supabase.co  api.dicebear.com
             api.dexscreener.com  nutcrash-server.onrender.com
             wss://nutcrash-server.onrender.com
frame-src:   syndication.twitter.com  platform.twitter.com
             twitter.com  x.com
```

---

## Design Language

```
Main site palette:
  --bg: #050301        (near-black warm)
  --gold: #C8A96E      (muted gold)
  --text: #EDE8DF      (warm cream)
  --muted: #7A6855
  --green: #4EC97A
  --red: #C94E4E

Casino palette:
  --bg: #0f1923        (dark blue-grey)
  --green: #00e701     (bright green)
  --gold: #f6c90e      (bright gold)
  --red: #ff4f4f
  --surface: #1a2c38
  --muted: #5f7281

Poker palette:
  --felt: #1a5c2a      (green felt)
  --gold: #c9a227      (rail trim)
  --bg: #0a0507        (dark room)

Fonts: Inter for UI text, Space Mono for numbers and mono display.
Card images: https://deckofcardsapi.com/static/img/{rank}{suit}.png
  rank: A 2 3 4 5 6 7 8 9 0(=ten) J Q K
  suit: S H D C
  back: back.png
```

---

## Feature Status (as of 2026-05-28)

| Feature | Status | Notes |
|---|---|---|
| Nut logging | Working | Supabase RPC |
| NUTTOKEN conversion | Working | nutkens.js |
| Casino overlay open/close | Working | |
| Wheel game | Working | Canvas |
| Flip game | Working | Canvas |
| Crash (solo) | Working | Canvas |
| Blackjack (21) | Working | DOM |
| Slope (nutslope.html) | Working | Iframe |
| Live Crash (WS) | Working | wss://.../  |
| Poker Hold'em (WS) | Working | wss://.../poker |
| DexScreener widget | Working | Iframe |
| Twitter embed | Working | Iframe |
| Profile page | Unknown | Needs audit |
| Predictions page | Unknown | Needs audit |
| Whitepaper page | Unknown | Needs audit |
| Casino events Supabase | Unknown | schema-casino.sql required |

---

## Overnight Audit Protocol

When running as an autonomous improvement agent, follow this order:

### Phase 1: Structural Audit (do not change anything yet)

1. Scan every `<script src>`, `<link href>`, `<img src>`, `<iframe src>` in every HTML file.
   - Check that every local path resolves to a real file in the repo.
   - Flag any JS file imported in HTML that does not exist in the repo.
   - List any external URL not in the CSP allowlist.

2. Check `vercel.json` CSP against all external URLs found in step 1.
   - Any external URL not in CSP will be silently blocked in production.

3. Read every JS file and look for:
   - `undefined` references to variables or functions declared elsewhere
   - Missing error handling around `fetch()`, WebSocket, and Supabase calls
   - `localStorage.getItem` calls that might return null and cause a crash
   - Functions that are defined but never called (dead code)
   - `console.error` or stack traces that would appear in production

4. Inspect postMessage flows between iframe layers.
   - Every `postMessage` sent by a child needs a matching `addEventListener('message')` in the parent.
   - Every `addEventListener('message')` should check `e.data && e.data.type` before acting.

5. Check mobile layout for each HTML file.
   - All pages should have `<meta name="viewport" content="width=device-width,initial-scale=1">`.
   - Nothing should overflow horizontally on a 375px screen.

### Phase 2: Fix in Priority Order

Priority 1 (fix immediately):
- Missing local JS/CSS/image files referenced in HTML
- CSP violations (add missing origins to vercel.json)
- JavaScript that crashes on load (syntax errors, undefined globals)
- postMessage handlers that are missing or broken

Priority 2 (fix in same PR if small):
- Error handling on fetch/WebSocket/Supabase
- Null checks on localStorage reads
- Mobile overflow issues

Priority 3 (one feature improvement per run):
- Loading states for async operations
- Better user-visible error messages (no hyphens or em dashes)
- Smoother animations on existing features
- Retry logic for WebSocket reconnections
- Any polish that improves feel without changing behavior

### Phase 3: Test Checklist (reason through; no browser available)

Walk through each user flow mentally and confirm the code path is complete:

- [ ] User opens site, nut log button visible, tap logs a nut via Supabase RPC
- [ ] User opens casino, tabs render, balance shows from localStorage
- [ ] Wheel tab: spin deducts bet, result overlay shows, balance updates
- [ ] Flip tab: choose side, flip animates, result overlays
- [ ] Crash tab: start, multiplier animates, cash out or bust
- [ ] 21 tab: deal, hit/stand, resolve pays correctly
- [ ] Poker tab: iframe loads poker-live.html, WS connects to /poker
- [ ] Live tab: iframe loads crash-live.html, WS connects to /
- [ ] Slope tab: iframe loads nutslope.html
- [ ] Casino close button sends casino:close postMessage
- [ ] poker:close and live:close messages switch back to wheel tab
- [ ] Balance postMessages sync between casino and main page

### Phase 4: PR

Create one PR with all changes from this run.

**PR title format:** `[auto] Audit pass YYYY-MM-DD HH:MM UTC`

**PR body must include:**
- Summary of what was audited
- List of issues found (even unfixed ones)
- List of changes made (file, what changed, why)
- List of remaining issues that need human review
- Any assumptions made

**Do not merge. Do not push to main.**

---

## Stop Conditions

Stop and document in the PR if you encounter:

- A change that requires reading/writing the Supabase schema
- A visual change you cannot verify without a browser
- A conflict between two files you cannot resolve confidently
- Any doubt about whether a change could break production

When stopped, write exactly what you found and what the next step would be.
