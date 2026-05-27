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
GOLD_DARK = (200, 120, 30)
GOLD_DEEP = (180, 90, 15)


def draw_nut_icon(size: int) -> Image.Image:
    """Gold peanut on dark rounded square, readable at 16px."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pad = max(1, round(size * 0.06))
    radius = max(2, round(size * 0.18))

    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(base)
    bd.rounded_rectangle((pad, pad, size - pad, size - pad), radius=radius, fill=(10, 6, 2, 255))
    border = max(1, round(size / 40))
    bd.rounded_rectangle(
        (pad, pad, size - pad, size - pad),
        radius=radius,
        outline=(*GOLD[:3], 220),
        width=border,
    )

    def lobe(left: bool) -> Image.Image:
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        if left:
            box = (
                round(size * 0.10),
                round(size * 0.26),
                round(size * 0.52),
                round(size * 0.74),
            )
            fill = (*GOLD_DARK[:3], 255)
            angle = 28
        else:
            box = (
                round(size * 0.48),
                round(size * 0.26),
                round(size * 0.90),
                round(size * 0.74),
            )
            fill = (*GOLD[:3], 255)
            angle = -28
        ld.ellipse(box, fill=fill)
        return layer.rotate(angle, resample=Image.Resampling.BICUBIC, center=(size / 2, size / 2))

    img = Image.alpha_composite(img, base)
    img = Image.alpha_composite(img, lobe(True))
    img = Image.alpha_composite(img, lobe(False))

    seam = ImageDraw.Draw(img)
    cx = size / 2
    seam.line(
        (cx - size * 0.02, size * 0.28, cx + size * 0.02, size * 0.72),
        fill=(*GOLD_DEEP[:3], 150),
        width=max(1, round(size / 36)),
    )

    if size >= 48:
        hi = ImageDraw.Draw(img)
        hi.ellipse(
            (
                round(size * 0.38),
                round(size * 0.34),
                round(size * 0.48),
                round(size * 0.46),
            ),
            fill=(255, 246, 220, 90),
        )

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
icon180 = draw_nut_icon(180)
icon180.save(IMG / "apple-touch-icon.png", "PNG")
icon180.resize((32, 32), Image.Resampling.LANCZOS).save(IMG / "favicon-32.png", "PNG")

sizes = [(16, 16), (32, 32), (48, 48)]
icons = [draw_nut_icon(s[0]) for s in sizes]
icons[0].save(
    IMG / "favicon.ico",
    format="ICO",
    sizes=[(im.width, im.height) for im in icons],
    append_images=icons[1:],
)
print("Wrote favicon.ico, favicon-32.png, apple-touch-icon.png")
