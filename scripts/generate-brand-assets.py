#!/usr/bin/env python3
"""Generate og.png and favicon.ico for $NUT, no external deps except Pillow."""
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

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ember glow (simple rings)
for i in range(12, 0, -1):
    g = 8 + i * 6
    draw.ellipse((W // 2 - 200 - i * 15, 40 - i * 8, W // 2 + 200 + i * 15, 320 + i * 8), outline=(g, 40, 4))

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
draw.text((W // 2, H - 48), "@TheNutTracker  ·  Solana memecoin", font=small_font, fill=(180, 160, 130), anchor="mm")

og_path = IMG / "og.png"
img.save(og_path, "PNG", optimize=True)
print(f"Wrote {og_path}")

# favicon 32 + apple 180
icon = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
idraw = ImageDraw.Draw(icon)
idraw.ellipse((8, 8, 172, 172), fill=(20, 12, 4), outline=GOLD, width=4)
try:
    ifont = ImageFont.truetype("arialbd.ttf", 72)
except OSError:
    ifont = ImageFont.load_default()
idraw.text((90, 95), "N", font=ifont, fill=GOLD, anchor="mm")
icon.save(IMG / "apple-touch-icon.png", "PNG")
icon.resize((32, 32), Image.Resampling.LANCZOS).save(IMG / "favicon-32.png", "PNG")
# multi-size ico
sizes = [(16, 16), (32, 32), (48, 48)]
icons = [icon.resize(s, Image.Resampling.LANCZOS) for s in sizes]
icons[0].save(IMG / "favicon.ico", format="ICO", sizes=[(s.width, s.height) for s in icons])
print("Wrote favicon.ico, apple-touch-icon.png")
