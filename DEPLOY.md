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

## 4. Production domain

Primary URL: **https://nutcoin.vercel.app**

In [Vercel](https://vercel.com) → Project → Settings → Domains:

1. Add `nutcoin.vercel.app` (if not already linked)
2. Optional: add a custom domain (e.g. `nutcoin.fun`) and set `SITE_URL` in `index.html` to match
3. `nutcoin-alpha.vercel.app` redirects to production via `vercel.json`

Deploy: `git push origin main`
