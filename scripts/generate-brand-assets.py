#!/usr/bin/env python3
"""Generate og.png, favicon.svg, favicon.ico and apple-touch-icon.png for $NUT."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "img"
IMG.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
BG = (5, 3, 1)
GOLD = (255, 217, 125)
EMBER = (232, 136, 32)
CREAM = (255, 248, 238)


def draw_favicon_mark(size: int) -> Image.Image:
    """Minimal gold N on black, readable at 16px."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = max(1, round(size * 0.06))
    radius = max(2, round(size * 0.16))
    draw.rounded_rectangle((pad, pad, size - pad, size - pad), radius=radius, fill=(5, 3, 1, 255))

    gold = (200, 169, 110, 255)
    s = size / 32.0

    def pt(x, y):
        return (round(x * s), round(y * s))

    # bold geometric N
    left = [pt(9, 9), pt(13.2, 9), pt(13.2, 23), pt(9, 23)]
    diag = [pt(13.2, 9), pt(18.8, 23), pt(14.6, 23), pt(9, 9)]
    right = [pt(18.8, 9), pt(22, 9), pt(22, 23), pt(18.8, 23)]
    draw.polygon(left, fill=gold)
    draw.polygon(diag, fill=gold)
    draw.polygon(right, fill=gold)

    return img


# ── OG image ─────────────────────────────────────────────────────────────
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

for i in range(12, 0, -1):
    g = 8 + i * 6
    draw.ellipse(
        (W // 2 - 200 - i * 15, 40 - i * 8, W // 2 + 200 + i * 15, 320 + i * 8),
        outline=(g, 40, 4),
    )

draw.rectangle((0, H - 120, W, H), fill=(8, 5, 2))

try:
    title_font = ImageFont.truetype("arialbd.ttf", 140)
    sub_font = ImageFont.truetype("arial.ttf", 36)
    small_font = ImageFont.truetype("arial.ttf", 28)
except OSError:
    title_font = ImageFont.load_default()
    sub_font = title_font
    small_font = title_font

draw.text((W // 2, 200), "$NUT", font=title_font, fill=GOLD, anchor="mm")
draw.text((W // 2, 320), "WORLD NUT TRACKING", font=sub_font, fill=CREAM, anchor="mm")
draw.text((W // 2, 380), "Tap. Count. Flex.", font=sub_font, fill=EMBER, anchor="mm")
draw.text(
    (W // 2, H - 48),
    "@TheNutTracker  ·  Solana memecoin",
    font=small_font,
    fill=(180, 160, 130),
    anchor="mm",
)

og_path = IMG / "og.png"
img.save(og_path, "PNG", optimize=True)
print(f"Wrote {og_path}")

# ── Favicons ─────────────────────────────────────────────────────────────
icon180 = draw_favicon_mark(180)
icon180.save(IMG / "apple-touch-icon.png", "PNG")
icon180.resize((32, 32), Image.Resampling.LANCZOS).save(IMG / "favicon-32.png", "PNG")

sizes = [(16, 16), (32, 32), (48, 48)]
icons = [draw_favicon_mark(s[0]) for s in sizes]
icons[0].save(
    IMG / "favicon.ico",
    format="ICO",
    sizes=[(im.width, im.height) for im in icons],
    append_images=icons[1:],
)
print("Wrote favicon.ico, favicon-32.png, apple-touch-icon.png")
