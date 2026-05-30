# Codex manual — $NUT casino live feed

Steps only a human with Supabase dashboard access can do. Run these before the live ticker and watchlist work globally.

## 1. Supabase SQL (required)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard) for project `ynzbwnlltqrprnrlbtna`.
2. Run **`supabase/schema.sql`** if not already applied (nut logs, `recent_activity`, `log_nut`).
3. Run **`supabase/schema-casino.sql`** (new):
   - Table `casino_events`
   - RPCs: `record_casino_event`, `live_community_feed`, `casino_watchlist`

## 2. Verify RPCs

In SQL Editor:

```sql
select * from live_community_feed(5);
select * from casino_watchlist(5);
```

Both should return rows (possibly empty), not “function does not exist”.

## 3. Deploy site

Push `main` to GitHub so Vercel redeploys `nutcoin-alpha.vercel.app`.

## 4. Optional: pump.fun CA

In `index.html`, set `CONTRACT_ADDR` to the Solana mint when live.

## 5. Poker (not built yet)

The site shows **POKER · SOON**. To add later:

- New tab in casino modal
- Either simple video-poker or table vs dealer
- Reuse `record_casino_event` with `p_game: 'poker'`

## 6. Troubleshooting

| Symptom | Fix |
|--------|-----|
| Ticker stuck on “Loading community feed…” | Run `schema-casino.sql`; hard refresh |
| Watchlist empty | Normal until real users win casino rounds |
| Activity feed error on nuts only | Run `schema.sql` `recent_activity` |
| Casino wins not global | `record_casino_event` not deployed or ad blocker blocking Supabase |

## 7. What is live vs local

- **NUTTOKENS balance** — localStorage on device
- **Nut logs** — Supabase `log_nut` (global)
- **Casino wins** — Supabase `record_casino_event` when profit &gt; 0; also adds **leaderboard points** in `nut_logs` (re-run `schema-casino.sql` + `log_nut` in `schema.sql` after updates)
- **Ticker** — merges Supabase `live_community_feed` + your session’s recent events
