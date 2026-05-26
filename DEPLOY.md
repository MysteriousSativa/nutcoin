# Deploy & launch checklist

## 1. Contract (mint)

After you launch on pump.fun, paste the Solana mint into `index.html`:

```javascript
const CONTRACT_ADDR = 'YOUR_MINT_HERE';
```

Then commit and push. BUY, CHART, and COPY CA activate automatically.

Pump.fun coin URL: `https://pump.fun/coin/{MINT}`

## 2. Social (live)

- X: https://x.com/TheNutTracker
- Telegram: https://t.me/TheNutTracker

## 3. OG image

```bash
pip install pillow
python scripts/generate-brand-assets.py
```

Outputs: `img/og.png`, `img/favicon.ico`, `img/apple-touch-icon.png`

## 4. Production domain (one-time in Vercel UI)

`nutcoin.vercel.app` must be added to **this** project (not a separate empty project).

1. [Vercel](https://vercel.com) → **nutcoin** project → **Settings** → **Domains**
2. Add `nutcoin.vercel.app` (or your custom domain)
3. In `index.html`, set `SITE_URL` and the `<link rel="canonical">` / `og:*` URLs to the new host
4. Optional: add the `redirects` block back to `vercel.json` (see git history `6d351bf`) so `nutcoin-alpha` → production

Until step 2 is done, the live URL stays **https://nutcoin-alpha.vercel.app**.

Deploy: `git push origin main`
