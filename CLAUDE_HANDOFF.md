# $NUT — Manual launch steps for Claude

**Repo:** MysteriousSativa/nutcoin  
**Live:** https://nutcoin-alpha.vercel.app/  
**Full spec:** read this file first before editing anything.

---

## Step 1 — Launch on pump.fun (OWNER ONLY — you wait)

Owner creates token on https://pump.fun and sends you the Solana mint address.

- Ticker: `NUT`
- Coin URL format: `https://pump.fun/coin/{MINT}`
- Do not invent a CA

---

## Step 2 — Set contract address (CLAUDE)

In `index.html` CONFIG:

```javascript
const CONTRACT_ADDR = 'PASTE_MINT_FROM_OWNER';
```

Push to main. Verify live:

- CA shows in banner
- BUY / CHART / COPY CA work
- `.tba` removed from buy buttons

---

## Step 3 — Social (mostly done; confirm with owner)

Current values:

```javascript
const TELEGRAM_URL = 'https://t.me/TheNutTracker';
const TWITTER_URL  = 'https://x.com/TheNutTracker';
const X_HANDLE     = '@TheNutTracker';
```

Ask owner:
- Is Telegram a group/channel URL? If yes, update `TELEGRAM_URL`.
- Owner pins launch tweet on X with CA + site link (not your job).

---

## Step 4 — Production domain (OWNER in Vercel, then CLAUDE in code)

Do not point URLs at `nutcoin.vercel.app` until it's aliased — it 404s today and breaks OG.

**Owner (Vercel dashboard):**

1. Vercel → nutcoin project → Settings → Domains
2. Add `nutcoin.vercel.app` (remove from any other project first)
3. Confirm `https://nutcoin.vercel.app/` returns 200

**Claude (after domain works):**

1. Update in `index.html` `<head>`: canonical, `og:url`, `og:image`, `twitter:image` → `https://nutcoin.vercel.app/...`
2. Set `SITE_URL = 'https://nutcoin.vercel.app'`
3. Add redirect in `vercel.json`:

```json
"redirects": [{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "nutcoin-alpha.vercel.app" }],
  "destination": "https://nutcoin.vercel.app/:path*",
  "permanent": true
}]
```

4. Push and verify `https://nutcoin.vercel.app/img/og.png` → 200

---

## Step 5 — OG / favicons (CLAUDE, only if copy changes)

Already live. Regenerate if needed:

```bash
pip install pillow
python scripts/generate-brand-assets.py
git add img/og.png img/favicon.ico img/apple-touch-icon.png
git push
```

Never use old ChatGPT PNGs, religious symbols, or checkerboard fake-alpha images.

---

## Step 6 — Supabase hardening (OWNER + CLAUDE, before real traffic)

Owner tightens RLS in Supabase dashboard. Optionally Claude adds rate-limit RPC and switches inserts from raw `.insert()` to RPC. Never commit service role key.

### Supabase schema (required, do not change column names)

```sql
create table nut_logs (
  id bigserial primary key,
  session_id text not null,
  nickname text,
  deed_date date default current_date,  -- NEVER rename
  deeds bigint,                          -- NEVER rename
  created_at timestamptz default now()
);

create or replace function leaderboard()
returns table(session_id text, nickname text, deeds bigint)
language sql security definer as $$
  select session_id, max(nickname), count(*)::bigint
  from nut_logs group by session_id order by count(*) desc;
$$;
```

---

## Step 7 — Verify before calling it "launched"

| Check | Pass? |
|-------|-------|
| Mobile scroll smooth (no goo drips / blur stacks) | |
| Hero: `$NUT`, pitch, CA or "Mint not live yet" | |
| BUY / CHART / COPY CA | |
| X + Telegram links correct | |
| OG preview shows `img/og.png` | |
| Global counter updates on tap | |
| Sticky mobile bar: BUY \| COPY CA \| CHART | |

---

## DO NOT

- Re-add `nut-logo.png` or ChatGPT button PNGs as required UI (nut-logo.png had Star of David filigree + checkerboard fake alpha)
- Redirect alpha → prod before prod domain serves this repo
- Use `mix-blend-mode: screen`, `background-attachment: fixed`, goo filters, heavy `backdrop-filter`
- Point OG at `nutcoin.vercel.app` before Vercel domain is linked
- Use `font-size:0` / `color:transparent` button hacks — all buttons are CSS-only now
- Commit `.env` or Supabase service role keys

---

## Quick reference — CONFIG block

```javascript
const TICKER         = 'NUT';
const CONTRACT_ADDR  = '';                                    // Step 2: owner provides mint
const TELEGRAM_URL   = 'https://t.me/TheNutTracker';         // Step 3: confirm group URL
const TWITTER_URL    = 'https://x.com/TheNutTracker';
const X_HANDLE       = '@TheNutTracker';
const SITE_URL       = 'https://nutcoin-alpha.vercel.app';   // Step 4: switch after domain
const SUPABASE_URL   = '...';
const SUPABASE_KEY   = '...';                                 // anon key only
```

---

## What buyers need to see in the first 3 seconds

- **Display:** `$NUT` large and readable, no religious filigree PNGs
- **One-line pitch** — honest, funny, not medieval RP
- **CA box** — copy button, monospace address when live
- **BUY + CHART + Telegram + X** — all working URLs from CONFIG
- **Social proof** — global nuts today / all-time (Supabase), with LIVE chip
- **Fast mobile** — no goo drips, no backdrop-blur stacks, no 30 animated PNG backgrounds

---

## What Claude needs from the owner to finish

1. Mint address (after pump.fun launch)
2. Real Telegram group URL if different from `https://t.me/TheNutTracker`
3. Confirmation that `nutcoin.vercel.app` is added in Vercel
