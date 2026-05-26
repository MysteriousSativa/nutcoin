# $NUT — Project handoff for Claude

Read this **before** editing. The site is a **single-file** app: `index.html` (~2.6k lines) deployed to Vercel at `https://nutcoin.vercel.app/` (alpha URL redirects).

## Product (one sentence)

**$NUT** is a Solana memecoin whose hook is a **global + personal nut counter** — joke product, real engagement loop (tap → cooldown → leaderboard → share card).

## What buyers need in the first 3 seconds

1. **Ticker** `$NUT` — huge, readable, no religious filigree PNGs
2. **One-line pitch** — honest, funny, not medieval RP
3. **CA box** — copy button, monospace address when live
4. **BUY** + **CHART** + **Telegram** + **X** — all working URLs from CONFIG
5. **Social proof** — global nuts today / all-time (Supabase), with LIVE chip
6. **Fast mobile** — no goo drips, no backdrop-blur stacks, no 30 animated PNG backgrounds

## CONFIG block (only edit these in `index.html`)

```javascript
const TICKER = 'NUT';
const CONTRACT_ADDR = '';        // pump.fun mint — enables buy/chart/copy
const TELEGRAM_URL = '';         // e.g. https://t.me/nutcoin
const TWITTER_URL = '';          // e.g. https://x.com/nutcoin
const SITE_URL = 'https://nutcoin.vercel.app';
const SUPABASE_URL = '...';
const SUPABASE_KEY = '...';      // anon key only — never service role
```

When `CONTRACT_ADDR` is set, `setupBuyButtons()` updates CA UI and removes `.tba` from buy buttons.

## Stack

| Layer | Tech |
|--------|------|
| Frontend | Vanilla HTML/CSS/JS, no build step |
| Deploy | Vercel static |
| Global stats | Supabase `nut_logs` + `leaderboard()` RPC |
| Personal stats | `localStorage` only |
| Buy | pump.fun link |
| Chart | DexScreener when CA set |

## Supabase schema (required)

```sql
create table nut_logs (
  id bigserial primary key,
  session_id text not null,
  nickname text,
  deed_date date default current_date,
  created_at timestamptz default now()
);
-- RLS: tighten before real launch (see critique — public insert is gameable)

create or replace function leaderboard()
returns table(session_id text, nickname text, deeds bigint)
language sql security definer as $$
  select session_id, max(nickname), count(*)::bigint
  from nut_logs group by session_id order by count(*) desc;
$$;
```

## Files

| Path | Purpose |
|------|---------|
| `index.html` | Entire app |
| `img/*` | Optional assets — **UI should not depend on button PNGs** |
| `vercel.json` | CSP headers |
| `CLAUDE_HANDOFF.md` | This file |

## DO NOT (repeat failures)

- Re-add `nut-logo.png` (had Star of David filigree + checkerboard fake alpha)
- Use ChatGPT PNGs with white plates as `background-image` on buttons
- `mix-blend-mode: screen` on bad PNGs
- `background-attachment: fixed` on full-page images
- 30+ drip elements + SVG `#goo` filter
- `backdrop-filter: blur()` on every panel
- Cinzel on body text (hard to read for CT traders)

## Visual direction (memecoin 2024–2026)

- **Display**: bold sans (`Inter` / system-ui) for `$NUT` and CTAs
- **Colors**: `#050301` bg, `#FFD97D` gold, ember orange CTAs
- **Layout**: mobile-first, sticky **BUY | COPY CA | CHART** above bottom nav
- **Vibe**: pump.fun energy — loud, simple, meme — not Diablo III UI clone

## Features map

| Feature | Panel / area |
|---------|----------------|
| Personal counter | `#nutCard` |
| Global stats | `#globalBar` + `#heroProof` |
| Leaderboard | panel 5, `fetchLeaderboard()` RPC |
| Cooldown | 10 min local + should be server-side at launch |
| Certificate | canvas modal |
| Badges / streak / oracle | panels 6–10 — secondary to buyers |

## Launch checklist

- [ ] `CONTRACT_ADDR` filled
- [ ] `TELEGRAM_URL` + `TWITTER_URL` filled
- [ ] Supabase RLS hardened (rate limit RPC)
- [ ] Production domain (not `-alpha`)
- [ ] OG image `img/og.png` with true alpha, no religious symbols
- [ ] Test mobile: sticky trade bar + no jank on scroll

## Whoever edits next

Pull latest `index.html`, search for `CONFIG`, `hero`, `sticky-trade`. Do not rebuild from old ChatGPT asset pipeline without alpha testing on `#050301`.
