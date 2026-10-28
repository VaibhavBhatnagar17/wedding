#!/usr/bin/env python3
"""Write mahak.html, Mahak's family's card, from index.html.

The two cards are one page. Everything that differs inside the page is
decided by js/side.js at load time, but WhatsApp builds its link preview
from the HTML without running any script, so the title, description and
preview image have to be in the file itself. This copies index.html and
changes only those, plus the <html data-side> that tells side.js whose card
it is.

    python3 tools/build-sides.py           # rewrite mahak.html
    python3 tools/build-sides.py --check   # fail if mahak.html is stale

Run it after every change to index.html; the browser checks fail otherwise.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "mahak.html")

SWAPS = [
    ('<html lang="en">',
     '<html lang="en" data-side="bride">\n'
     '<!-- Generated from index.html by tools/build-sides.py. Edit index.html, then run it. -->'),
    ("<title>Vaibhav &amp; Mahak · ", "<title>Mahak &amp; Vaibhav · "),
    ('content="Vaibhav Bhatnagar weds Mahak Kalra — ', 'content="Mahak Kalra weds Vaibhav Bhatnagar — '),
    ('<meta property="og:title" content="Vaibhav &amp; Mahak — ', '<meta property="og:title" content="Mahak &amp; Vaibhav — '),
    ("/assets/og.jpg", "/assets/og-mahak.jpg"),
    ('data-i18n="names.pair">Vaibhav &amp; Mahak</div>', 'data-i18n="names.pair">Mahak &amp; Vaibhav</div>'),
]


def build():
    with open(SRC, encoding="utf-8") as f:
        html = f.read()
    for old, new in SWAPS:
        n = html.count(old)
        if n == 0:
            sys.exit("index.html no longer contains %r — update SWAPS in tools/build-sides.py" % old)
        html = html.replace(old, new)
    return html


def main():
    html = build()
    if "--check" in sys.argv:
        with open(OUT, encoding="utf-8") as f:
            if f.read() != html:
                sys.exit("mahak.html is stale: run python3 tools/build-sides.py")
        print("mahak.html is up to date")
        return
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote mahak.html")


if __name__ == "__main__":
    main()
