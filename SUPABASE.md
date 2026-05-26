# Supabase setup for $NUT

Global nut counter + leaderboard. Personal stats stay in `localStorage` only.

**Live project (already in `index.html`):** `https://ynzbwnlltqrprnrlbtna.supabase.co`

---

## For the site owner (manual, ~10 minutes)

### 1. Open Supabase

1. Go to https://supabase.com/dashboard
2. Open project **ynzbwnlltqrprnrlbtna** (or create a new one if starting fresh)

### 2. Run the schema

1. **SQL Editor** → **New query**
2. Paste the full contents of **`supabase/schema.sql`**
3. Click **Run**
4. You should see “Success” with no errors

This creates:

| Piece | Purpose |
|--------|---------|
| `nut_logs` table | One row per logged nut |
| `log_nut()` RPC | Insert with **10-minute cooldown**, `nut_type`, `points` (1 or 2 for 2× hour) |
| `nut_type_stats()` RPC | Optional global method mix for a date |
| `global_counts()` RPC | Today + all-time totals without exposing raw rows |
| `leaderboard()` RPC | Top 20 sessions by count |
| RLS | Table locked down; only RPCs are callable from the website |

### 3. Confirm API keys

1. **Project Settings** → **API**
2. Copy **Project URL** and **anon public** key (not service_role)
3. In `index.html` CONFIG, set:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'eyJ...anon...';  // anon only
```

### 4. Smoke test

1. Deploy site (or open `index.html` via local static server with CSP allowing Supabase)
2. Open https://nutcoin-alpha.vercel.app/
3. Tap **NUT** once → global “today” should increment within a few seconds
4. Open **Leaderboard** panel → your session should appear (or “No nuts yet” then update)
5. In Supabase **Table Editor** → `nut_logs` → confirm a new row

### 5. Optional: new project from scratch

If you prefer a clean project:

1. **New project** → name e.g. `nutcoin`
2. Run `supabase/schema.sql`
3. Paste new URL + anon key into `index.html`
4. Push to GitHub

---

## For Claude (code + verify)

Read **`supabase/schema.sql`** and **`index.html`** CONFIG + Supabase section.

### What is already wired in the client

```javascript
// CONFIG
const SUPABASE_URL = '...';
const SUPABASE_KEY = '...';  // anon only

// Calls (do not revert to raw .from('nut_logs').insert)
db.rpc('log_nut', { p_session_id, p_nickname, p_deed_date: dateStr, p_nut_type: selectedNutType })
db.rpc('global_counts', { p_deed_date: dateStr })
db.rpc('leaderboard')
```

### Claude checklist after owner runs SQL

- [ ] Owner confirmed `supabase/schema.sql` ran without errors
- [ ] `SUPABASE_URL` / `SUPABASE_KEY` in `index.html` match **Settings → API** (anon key)
- [ ] Live site: global counter not `-` / “configure Supabase”
- [ ] Live site: leaderboard loads without SQL error message
- [ ] Supabase **Logs → API**: `log_nut`, `global_counts`, `leaderboard` return 200
- [ ] Never commit **service_role** key
- [ ] `vercel.json` CSP already allows `https://*.supabase.co` and `wss://*.supabase.co`

### If leaderboard shows an error

1. SQL Editor: `select * from leaderboard();`, must return rows or empty set, not error
2. If function missing: re-run `supabase/schema.sql`
3. If `permission denied`: re-run the `grant execute` lines at bottom of schema

### If global counter stays `-`

1. Browser devtools → Network → filter `supabase` → check `global_counts` response
2. Confirm anon key is not expired / wrong project
3. Confirm RLS: direct `select` on `nut_logs` from client should **fail** (expected); RPC should work

### If inserts fail silently

`logToSupabase()` swallows errors. Temporarily log for debug:

```javascript
const { data, error } = await db.rpc('log_nut', { ... });
if (error) console.warn('log_nut', error);
if (data && !data.ok) console.warn('log_nut', data);
```

Remove before production.

### Do not

- Re-enable `create policy ... for insert with check (true)` on `nut_logs` (gameable)
- Use `.from('nut_logs').select('*')` for leaderboard (pulls entire table)
- Put service_role key in `index.html` or git

### Schema changes

Edit **`supabase/schema.sql`**, document in commit message, tell owner to re-run in SQL Editor (or use Supabase CLI migrations if they adopt it later).

---

## Architecture

```
Browser (anon key)
    │
    ├─► rpc log_nut(session_id, nickname, deed_date)  ──► INSERT (cooldown checked)
    ├─► rpc global_counts(deed_date)                  ──► counts only
    └─► rpc leaderboard()                             ──► top 20 aggregated

nut_logs table ◄── only security definer functions touch it (RLS blocks anon)
```

**Session ID:** `localStorage` UUID per browser, not authentication; cooldown limits spam per browser.

---

## Files

| File | Role |
|------|------|
| `supabase/schema.sql` | Single source of truth, run in dashboard |
| `SUPABASE.md` | This doc |
| `index.html` | `SUPABASE_URL`, `SUPABASE_KEY`, RPC calls |
| `CLAUDE_HANDOFF.md` | Links here for Step 6 |
