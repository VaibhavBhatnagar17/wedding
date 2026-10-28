#!/usr/bin/env python3
"""Draw the WhatsApp link previews, one per family's card.

    python3 tools/make-og.py

assets/og.jpg        Vaibhav's family's card: "Vaibhav & Mahak"
assets/og-mahak.jpg  Mahak's family's card:   "Mahak & Vaibhav"

1200×630, the painted hotel on the left and the names on the right. Needs
Pillow; the three Google fonts are fetched into /tmp/khumani/fonts once.
"""
import os
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = "/tmp/khumani/fonts/"
FONT_URLS = {
    "Cinzel%5Bwght%5D.ttf": "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf",
    "CormorantGaramond%5Bwght%5D.ttf": "https://github.com/google/fonts/raw/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
    "Italianno-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/italianno/Italianno-Regular.ttf",
}
CARDS = [
    ("og.jpg", "THE BHATNAGAR FAMILY INVITES YOU", "Vaibhav", "Mahak"),
    ("og-mahak.jpg", "THE KALRA FAMILY INVITES YOU", "Mahak", "Vaibhav"),
]
W, H = 1200, 630
GOLD, PALE, MUTED, LINE = (232, 200, 106), (247, 236, 201), (214, 186, 140), (201, 162, 39)
MAROON = (43, 8, 16)


def fonts():
    os.makedirs(FONTS, exist_ok=True)
    for name, url in FONT_URLS.items():
        if not os.path.exists(FONTS + name):
            urllib.request.urlretrieve(url, FONTS + name)


def draw(top, first, second):
    src = Image.open(os.path.join(ROOT, "assets/art/venue-khumani.webp")).convert("RGB")
    og = Image.new("RGB", (W, H), MAROON)
    pw = 660
    p = src.resize((int(src.width * H / src.height), H), Image.LANCZOS)
    left = (p.width - pw) // 2
    og.paste(p.crop((left, 0, left + pw, H)), (0, 0))
    # a soft maroon fade from the painting into the text panel
    fade = Image.new("L", (240, H))
    fd = ImageDraw.Draw(fade)
    for x in range(240):
        fd.line([(x, 0), (x, H)], fill=int(255 * (x / 239) ** 1.4))
    og.paste(Image.new("RGB", (240, H), MAROON), (pw - 240, 0), fade)

    d = ImageDraw.Draw(og)
    cx = 600 + (W - 600) // 2 + 30
    cinzel = lambda s: ImageFont.truetype(FONTS + "Cinzel%5Bwght%5D.ttf", s)
    script = ImageFont.truetype(FONTS + "Italianno-Regular.ttf", 132)
    corm = ImageFont.truetype(FONTS + "CormorantGaramond%5Bwght%5D.ttf", 34)

    def centre(text, font, y, fill):
        d.text((cx - d.textlength(text, font=font) / 2, y), text, font=font, fill=fill)

    centre(top, cinzel(17), 94, MUTED)
    centre(first, script, 132, GOLD)
    centre("&", cinzel(30), 262, MUTED)
    centre(second, script, 290, GOLD)
    d.line([(cx - 120, 446), (cx + 120, 446)], fill=LINE, width=1)
    centre("1 & 2 FEBRUARY 2027", cinzel(30), 466, PALE)
    centre("Hotel Khumani · Udaipur", corm, 516, MUTED)
    d.rectangle([14, 14, W - 15, H - 15], outline=LINE, width=2)
    return og


def main():
    fonts()
    for name, top, first, second in CARDS:
        out = os.path.join(ROOT, "assets", name)
        draw(top, first, second).save(out, "JPEG", quality=86, optimize=True, progressive=True)
        print("wrote assets/%s  %d KB" % (name, os.path.getsize(out) // 1024))


if __name__ == "__main__":
    main()
