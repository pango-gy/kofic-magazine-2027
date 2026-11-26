#!/usr/bin/env python3
"""Make the images shown when a page is shared (KakaoTalk, Slack, X…).

    python3 scripts/build_og.py            # only what is missing
    python3 scripts/build_og.py --force    # everything again

Writes 1200x630 JPGs (some services do not preview WebP):
    assets/images/og/<issue>.jpg           the issue's card: logo, issue name, cover photo
    assets/images/og/<issue>/<slug>.jpg    one per article, cut from its lead photo

scripts/build_site.py then points each page's og:image at these files; run it
after this script. Needs Pillow, and Google Chrome for the issue cards (they
are drawn as a small HTML page, so they use the site's own logo and typeface).
"""
import html
import json
import os
import re
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = (1200, 630)
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
FORCE = "--force" in sys.argv


def path(*parts):
    return os.path.join(ROOT, *parts)


def cover_crop(src, dst):
    """Fill 1200x630 from the middle of the photo, a little above centre."""
    im = Image.open(src).convert("RGB")
    scale = max(SIZE[0] / im.width, SIZE[1] / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left = (im.width - SIZE[0]) // 2
    top = round((im.height - SIZE[1]) * 0.3)
    im.crop((left, top, left + SIZE[0], top + SIZE[1])).save(dst, "JPEG", quality=84, optimize=True, progressive=True)


CARD = """<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
html, body {{ margin: 0; }}
body {{ inline-size: 1200px; block-size: 630px; display: grid; grid-template-columns: 560px 1fr; background: #fff;
       font-family: "Pretendard Variable", Pretendard, sans-serif; color: #17141f; overflow: hidden; }}
.text {{ display: flex; flex-direction: column; justify-content: space-between; padding: 64px 0 60px 68px; }}
.logo {{ display: block; inline-size: 300px; block-size: auto; }}
h1 {{ margin: 0; font-size: 108px; font-weight: 800; line-height: 1.02; letter-spacing: -0.06em; }}
p {{ margin: 18px 0 0; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: #55525e; }}
.photo {{ inline-size: 100%; block-size: 630px; object-fit: cover; object-position: {pos}; }}
</style></head><body>
<div class="text"><img class="logo" src="./assets/images/common/logo-c.svg" alt="">
<div><h1>{line1}<br>{line2}</h1><p>{title}</p></div></div>
<img class="photo" src="{photo}" alt="">
</body></html>"""


def issue_card(issue, dst):
    main = path(issue["id"], "index.html")
    photo, pos = None, "50% 30%"
    if os.path.exists(main):
        text = open(main, encoding="utf-8").read()
        m = re.search(r'<a class="mk-cover-card mk-cover-card--a".*?<img src="\.\./([^"]+)"', text, re.S)
        if m:
            photo = "./" + m.group(1)
    if not photo:
        photo = "./assets/images/" + issue["articles"][0]["image"]
    year, month = re.match(r"(\d+년)\s*(.+)", issue["label"]).groups()
    tmp = path("_og_card.html")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(CARD.format(line1=year, line2=month, title=html.escape(issue.get("title", "")), photo=photo, pos=pos))
    png = dst[:-4] + ".png"
    try:
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1200,630",
                        "--virtual-time-budget=6000", f"--screenshot={png}", "file://" + tmp],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        Image.open(png).convert("RGB").resize(SIZE, Image.LANCZOS).save(dst, "JPEG", quality=88, optimize=True, progressive=True)
    finally:
        for p in (tmp, png):
            if os.path.exists(p):
                os.remove(p)


def main():
    site = json.load(open(path("data", "site.json"), encoding="utf-8"))
    made = 0
    for iid in site["issues"]:
        issue = json.load(open(path("data", f"{iid}.json"), encoding="utf-8"))
        os.makedirs(path("assets", "images", "og", iid), exist_ok=True)
        card = path("assets", "images", "og", f"{iid}.jpg")
        if FORCE or not os.path.exists(card):
            issue_card(issue, card)
            made += 1
        for a in issue["articles"]:
            dst = path("assets", "images", "og", iid, a["file"].replace(".html", ".jpg"))
            if FORCE or not os.path.exists(dst):
                cover_crop(path("assets", "images", a["image"]), dst)
                made += 1
    print(f"og images made: {made}")


if __name__ == "__main__":
    main()
