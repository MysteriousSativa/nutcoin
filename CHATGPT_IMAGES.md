# ChatGPT image prompts for Claude, $NUT

**Read this before generating or swapping any images.** Use **ChatGPT** (DALL·E / image gen) for all marketing art. Do **not** use religious filigree, Star of David shapes, checkerboard fake transparency, or cream parchment unless explicitly asked.

---

## Workflow for Claude

1. Call `getReceiptPayload()` in browser console on the live site (or read values from `index.html` CONFIG + user stats) to fill prompts below.
2. Generate images in ChatGPT at exact pixel sizes.
3. Export **PNG with true transparency** only where needed; receipt background should be **opaque** (dark `#050301`).
4. Save into `img/` and commit. Update `RECEIPT_BG_IMAGE` in `index.html` if using a custom background.
5. Test: **Get Receipt** → **Download PNG** → **Post Receipt to X**, image must be readable on mobile at thumbnail size.

---

## Dynamic values (paste real numbers)

When prompting, replace placeholders:

| Placeholder | Source |
|-------------|--------|
| `{TODAY}` | `countToday` |
| `{ALLTIME}` | `countAllTime` |
| `{PARTNERED}` | partnered nuts today |
| `{SESSION}` | session count |
| `{STREAK}` | streak days |
| `{METHOD}` | last nut method label (Solo, Partnered, Quickie…) |
| `{METHOD_EMOJI}` | e.g. 💑 ✊ ⚡ |
| `{NICK}` | nickname or Anonymous |
| `{DATE}` | today's date |
| `{VERDICT}` | achievement one-liner |
| `{VARIETY}` | unique methods logged today |
| `{SITE}` | SITE_URL |
| `{X}` | @TheNutTracker |

---

## 1. Share receipt (primary), `img/receipt-share.png`

**Size:** 1080 × 1350 px (portrait, X/Telegram/IG story)  
**Used for:** Download receipt + attach to tweet

### ChatGPT prompt (copy/paste)

```
Create a shareable social media receipt poster for a parody crypto memecoin called $NUT.

Canvas: 1080x1350 pixels, portrait. Background: very dark brown-black #050301 with subtle orange-gold glow at top center. NO parchment. NO religious symbols. NO checkerboard.

Layout (bold, readable on phone):
- Top small label: "OFFICIAL NUT RECEIPT · FORM 69-A"
- Huge text: "$NUT" in gold #FFD97D
- Giant number: "{TODAY}" with label "NUTS TODAY"
- Subline: "Last logged: {METHOD_EMOJI} {METHOD}" and smaller "solo · partnered · all methods count"
- Four stat boxes in a row: ALL-TIME {ALLTIME} | PARTNERED TODAY {PARTNERED} | STREAK {STREAK} | SESSION {SESSION}
- Issued to: {NICK}
- Quote in a dark card: "{VERDICT}"
- Bottom: fake barcode strip, @TheNutTracker, "POST AT YOUR OWN RISK", nutcoin meme energy

Style: 2024 pump.fun / degen Twitter, Inter-like sans serif, gold on black, ember orange accents, slightly unhinged but clean. Meme coin not corporate. No photorealistic people. No explicit nudity, suggestive humor only via text.

Typography must be sharp and high contrast. Export as flat PNG, opaque background.
```

After generation, save as **`img/receipt-share.png`** and set in `index.html`:

```javascript
const RECEIPT_BG_IMAGE = './img/receipt-share.png';
```

The site **overlays live stats in canvas** on top of this BG, OR uses pure canvas if file missing.

---

## 2. Open Graph / link preview, `img/og.png`

**Size:** 1200 × 630 px

```
Dark #050301 background, gold "$NUT" wordmark, tagline "Every nut counts, solo, sex, chaos, all logged."
Subtext: @TheNutTracker · Solana memecoin · World Nut Tracking
Subtle peanut/ember glow, no faces, no religious icons, no checkerboard. Clean bold sans serif. Opaque PNG 1200x630.
```

Regenerate with: `python scripts/generate-brand-assets.py` OR ChatGPT if you want illustrated style.

---

## 3. Method-specific receipt variants (optional set)

Generate one per top method for viral variety. Save as `img/receipt-partner.png`, `img/receipt-solo.png`, etc.

**Partnered example:**

```
Same 1080x1350 dark gold $NUT receipt template but headline accent "PARTNERED NUT CERTIFIED" with emoji 💑, playful energy "body count respectfully updated", stats {TODAY} {ALLTIME}, @TheNutTracker, meme degen style, opaque PNG.
```

**Solo example:** replace with ✊ "SOLO MISSION"  
**Quickie:** ⚡ "SPEED RUN"  
**Hotel:** 🏨 "ROAD WARRIOR"

Wire in code only if you add `RECEIPT_BG_BY_TYPE` map in CONFIG.

---

## 4. X post templates (no image, text only)

Claude should pair receipt PNG with copy from `pickStirTweet()` / `pickCertStirTweet()` in `index.html`. Always tell user to **attach** the downloaded PNG.

---

## 5. Assets to NEVER use again

| Banned | Why |
|--------|-----|
| `nut-logo.png` (old) | Star of David filigree |
| `parchment.png` on receipt | reads as boring / AI slop on X |
| `nut-coin.jpg` on receipt | wrong vibe |
| ChatGPT white mat PNGs as CSS buttons | fake alpha |
| Cinzel parchment certificate | low viral share rate |

---

## 6. Code touchpoints (Claude)

| File | What |
|------|------|
| `index.html` | `RECEIPT_BG_IMAGE`, `getReceiptPayload()`, `renderCertificate()` |
| `img/receipt-share.png` | Optional ChatGPT background |
| `scripts/generate-brand-assets.py` | OG/favicon only |
| `CHATGPT_IMAGES.md` | This file |

Receipt is rendered at **1080×1350** for download/share. If you change size, update `renderCertificate()` `W` and `H`.

---

## 7. QA checklist

- [ ] Receipt readable at 300px width (X timeline)
- [ ] Shows **today**, **all-time**, **method**, **partnered today**
- [ ] Download filename `NUT-Receipt-{date}-{nick}.png`
- [ ] Share opens X composer + auto-downloads PNG on desktop
- [ ] No parchment / no religious imagery
- [ ] `img/*` committed, under 500KB each when possible
