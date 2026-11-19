#!/usr/bin/env python3
"""
Bakes two pre-lit versions of the background's glass bubble from public/images/bubbles/glass.webp:

- glass-lit.webp: for bubbles rising in the light shafts. The bright surface overhead shows as a
  soft window inside the top of the bubble, the rim is brighter on top, and the light it gathers
  lands as a small cyan focus inside the bottom.
- glass-shade.webp: for bubbles at the dark edges. Dimmer, bluer, with a fainter glint.

UnderwaterBubbles picks one per rise from how much shaft light is at its start (sceneLightAt), so the
lighting costs nothing while it moves. Run after changing glass.webp:

    python3 scripts/brand/bake-bubble-light.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "public/images/bubbles"


def layer(size, draw, blur):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw(ImageDraw.Draw(img), size)
    return img.filter(ImageFilter.GaussianBlur(blur * size / 256))


def lit(base):
    s = base.width
    out = base.copy()
    k = s / 256
    # Surface window: a soft crescent of daylight just inside the top rim.
    out.alpha_composite(layer(s, lambda d, s: d.ellipse((74 * k, 30 * k, 182 * k, 70 * k), fill=(210, 248, 255, 120)), 7))
    out.alpha_composite(layer(s, lambda d, s: d.ellipse((96 * k, 34 * k, 160 * k, 52 * k), fill=(240, 253, 255, 150)), 3))
    # Upper rim catches more light.
    out.alpha_composite(layer(s, lambda d, s: d.arc((30 * k, 30 * k, 226 * k, 226 * k), 205, 335, fill=(190, 246, 255, 190), width=max(2, round(4 * k))), 1.5))
    # The gathered light focused near the bottom.
    out.alpha_composite(layer(s, lambda d, s: d.ellipse((92 * k, 188 * k, 164 * k, 224 * k), fill=(120, 232, 255, 150)), 9))
    return out


def shade(base):
    r, g, b, a = base.split()
    return Image.merge(
        "RGBA",
        (
            r.point(lambda v: int(v * 0.55)),
            g.point(lambda v: int(v * 0.78)),
            b.point(lambda v: int(min(255, v * 1.0))),
            a.point(lambda v: int(v * 0.6)),
        ),
    )


def main():
    base = Image.open(DIR / "glass.webp").convert("RGBA")
    for name, img in (("glass-lit.webp", lit(base)), ("glass-shade.webp", shade(base))):
        path = DIR / name
        img.save(path, "WEBP", quality=88, method=6)
        print(f"{name}  {path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
