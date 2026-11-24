#!/usr/bin/env python3
"""Build the film pages of an issue's Production section.

    python3 scripts/build_films.py 2026-10

Source of truth: <issue>/production.html
  * the production table (.common-table-1): one row per film, in release order
  * the film list between <!-- films:start --> and <!-- films:end -->:
    gives each film its id, its poster, and optional data-related links
    ("label|href;label|href", hrefs relative to production.html)

Output
  * <issue>/production/film-NN.html, one static page per film
  * the film list in production.html (and its poster wall, if the page has
    <!-- wall:start --> / <!-- wall:end --> markers), rewritten in place

Pages reuse production.html's own <head>, header and footer, so a change to
the site chrome there carries over on the next run. Nothing is fetched.

People are set as names. A portrait is shown only for those listed in
assets/images/people/credits.json for that film (free-licence photos from
Wikimedia Commons); each page prints the author, licence and source of every
portrait it uses, which those licences require.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COLS = ["no", "year", "title", "en", "release", "genre", "crank_in", "crank_up", "shoots", "director",
        "cast", "produced_by", "producer", "writer", "company", "distributor", "presenter", "note"]
FACTS = [("제작연도", "year"), ("크랭크인", "crank_in"), ("크랭크업", "crank_up"), ("촬영 회차", "shoots"),
         ("제작", "produced_by"), ("프로듀서", "producer"), ("각본", "writer"), ("제작사", "company"),
         ("배급", "distributor"), ("제공", "presenter")]
STRIP = 8  # other releases shown under a film
CREDITS = ROOT / "assets" / "images" / "people" / "credits.json"


def load_portraits():
    if not CREDITS.exists():
        return {}
    return json.loads(CREDITS.read_text(encoding="utf-8")).get("people", {})


def clean(text):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", text))).strip()


def names(text):
    return [n for n in (clean(x) for x in re.split(r"\s*[,/]\s*", text)) if n]


def esc(text):
    return html.escape(text, quote=True)


def between(source, start, end):
    a = source.index(start) + len(start)
    return a, source.index(end, a)


def read_films(page):
    a, b = between(page, "<!-- films:start -->", "<!-- films:end -->")
    block = page[a:b]
    listed = []
    for m in re.finditer(r'<a\b[^>]*\bid="(film-\d+)"[^>]*>', block):
        related = re.search(r'data-related="([^"]*)"', m.group(0))
        poster = re.search(r'<img[^>]*\bsrc="([^"]+)"', block[m.end():]).group(1)
        listed.append((m.group(1), poster, related.group(1) if related else ""))
    table = page[page.index('<div class="common-table-1"'):]
    rows = re.findall(r"<tr>(.*?)</tr>", table[table.index("<tbody>"):table.index("</tbody>")], re.S)
    if len(rows) < len(listed):
        sys.exit(f"table has {len(rows)} rows but the list has {len(listed)} films")
    films = []
    for (fid, poster, related), row in zip(listed, rows):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)[-len(COLS):]
        film = {key: clean(cell) for key, cell in zip(COLS, cells)}
        film["notes"] = [n for n in (clean(x) for x in re.split(r"<br\s*/?>|\n", cells[-1])) if n]
        film["id"], film["poster"] = fid, poster
        film["related"] = [r.split("|", 1) for r in related.split(";") if "|" in r]
        if film["year"]:
            film["year"] += "년"
        films.append(film)
    return films


def short_date(release):
    m = re.match(r"\d{4}-(\d{2})-(\d{2})", release)
    return f"{m.group(1)}.{m.group(2)} 개봉" if m else release


def list_html(films):
    out = []
    for f in films:
        related = ";".join("|".join(r) for r in f["related"])
        attr = f' data-related="{esc(related)}"' if related else ""
        meta = " · ".join(x for x in (short_date(f["release"]), f["genre"]) if x)
        out.append(
            f'                <li><a class="mk-plist-item" id="{f["id"]}" href="./production/{f["id"]}.html"{attr}>'
            f'<span class="mk-plist-poster"><img src="{f["poster"]}" alt="" width="292" height="403" loading="lazy" decoding="async"></span>'
            f'<span class="mk-plist-date">{esc(meta)}</span>'
            f'<span class="mk-plist-title">{esc(f["title"])}</span></a></li>')
    return "\n" + "\n".join(out) + "\n                "


def wall_html(films):
    return "\n" + "\n".join(
        f'                        <li><img src="{f["poster"]}" alt="" width="292" height="403" loading="lazy" decoding="async"></li>'
        for f in films) + "\n                        "


def block(title_en, title_ko, body, extra=""):
    return (f'                <div class="mk-film-block{extra}">\n'
            f'                    <h2 class="mk-film-block-title"><span lang="en">{title_en}</span><span>{title_ko}</span></h2>\n'
            f'{body}\n                </div>')


def film_main(films, i, portraits):
    f = films[i]
    prev, nxt = films[i - 1], films[(i + 1) % len(films)]
    up = lambda path: path if re.match(r"https?://|/", path) else "../" + path.removeprefix("./")
    poster = lambda film: "../" + film["poster"]

    info = []
    if f["en"]:
        info.append(f'                    <p class="mk-film-en" lang="en">{esc(f["en"])}</p>')
    info.append(f'                    <h1 class="mk-film-title">{esc(f["title"])}</h1>')
    meta = " · ".join(x for x in (f["release"] and f["release"] + " 개봉", f["genre"]) if x)
    info.append(f'                    <p class="mk-film-meta">{esc(meta)}</p>')
    if f["notes"]:
        info.append('                    <ul class="mk-film-notes">' + "".join(f"<li>{esc(n)}</li>" for n in f["notes"]) + "</ul>")

    people = [("감독", n) for n in names(f["director"])] + [("출연", n) for n in names(f["cast"])]
    shown = []
    if people:
        rows = []
        for role, name in people:
            p = portraits.get(name)
            if p and f["id"] in p.get("films", []):
                shown.append((name, p))
                face = f'<span class="mk-film-face"><img src="../../{p["photo"]}" alt="" width="400" height="500" loading="lazy" decoding="async"></span>'
            else:  # no usable photo: the first letter stands in
                face = f'<span class="mk-film-face is-empty" aria-hidden="true">{esc(name[0])}</span>'
            cls = ' class="is-director"' if role == "감독" else ""
            rows.append(f"                        <li{cls}>{face}<span>{role}</span><b>{esc(name)}</b></li>")
        rows = "\n".join(rows)
        body = f'                    <ul class="mk-film-people">\n{rows}\n                    </ul>'
        if shown:
            credit = " · ".join(
                f'{esc(name)}: <a href="{esc(p["source"])}" rel="noopener">{esc(p["author"])}</a>, '
                f'<a href="{esc(p["license_url"])}" rel="license noopener">{esc(p["license"])}</a>' for name, p in shown)
            body += f'\n                    <p class="mk-film-photo-credit">인물 사진 출처(위키미디어 공용, 원본을 잘라 사용) — {credit}</p>'
        info.append(block("Cast", "감독·출연", body))
    facts = [(label, f[key]) for label, key in FACTS if f[key]]
    if facts:
        rows = "\n".join(f"                        <div><dt>{label}</dt><dd>{esc(value)}</dd></div>" for label, value in facts)
        info.append(block("Credits", "제작 정보", f'                    <dl class="mk-film-facts">\n{rows}\n                    </dl>'))
    if f["related"]:
        rows = "\n".join(f'                        <li><a href="{esc(up(href))}">{esc(label)} <span aria-hidden="true">→</span></a></li>'
                         for label, href in f["related"])
        info.append(block("Related", "관련 기사", f'                    <ul class="mk-film-related">\n{rows}\n                    </ul>'))

    others = [films[(i + k) % len(films)] for k in range(1, min(STRIP, len(films) - 1) + 1)]
    strip = "\n".join(
        f'                        <li><a href="./{o["id"]}.html"><img src="{poster(o)}" alt="" width="292" height="403" loading="lazy" decoding="async"><span>{esc(o["title"])}</span></a></li>'
        for o in others)
    more = (f'                <div class="mk-film-block mk-film-more">\n'
            f'                    <h2 class="mk-film-block-title"><span lang="en">More</span><span>다른 개봉작</span>'
            f'<a class="mk-film-all" href="../production.html">전체 {len(films)}편 보기 <span aria-hidden="true">→</span></a></h2>\n'
            f'                    <ul class="mk-film-strip">\n{strip}\n                    </ul>\n                </div>')

    return f'''    <main id="main-content">
        <article class="mk-film">
            <nav class="mk-film-bar" aria-label="영화 이동">
                <a class="mk-film-back" href="../production.html#{f["id"]}"><span aria-hidden="true">←</span> 개봉작 {len(films)}편</a>
                <div class="mk-film-pager">
                    <a href="./{prev["id"]}.html" rel="prev"><span aria-hidden="true">←</span> {esc(prev["title"])}</a>
                    <span>{i + 1} / {len(films)}</span>
                    <a href="./{nxt["id"]}.html" rel="next">{esc(nxt["title"])} <span aria-hidden="true">→</span></a>
                </div>
            </nav>
            <div class="mk-film-body">
                <div class="mk-film-poster"><img src="{poster(f)}" alt="{esc(f["title"])} 포스터" width="292" height="403" fetchpriority="high"></div>
                <div class="mk-film-info">
{chr(10).join(info)}
                </div>
            </div>
{more}
        </article>
    </main>'''


def film_page(shell_top, shell_bottom, films, i, portraits):
    f = films[i]
    # one pass, so "./x" (-> "../x") is not deepened a second time
    deepen = lambda part: re.sub(r'((?:href|src)=")(\.\.?)/', lambda m: m.group(1) + ("../../" if m.group(2) == ".." else "../"), part)
    top = deepen(shell_top)
    top = re.sub(r"<title>.*?</title>", f"<title>{esc(f['title'])} | 한국영화 제작 현황 | 웹진 한국영화</title>", top, count=1, flags=re.S)
    summary = " · ".join(x for x in (f["release"] and f["release"] + " 개봉", f["genre"], f["director"] and "감독 " + f["director"],
                                    f["cast"] and "출연 " + f["cast"]) if x)
    top = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + esc(summary) + m.group(2), top, count=1)
    top = re.sub(r"\n\s*<style>.*?</style>", "", top, count=1, flags=re.S)  # the table-only styles of production.html
    return top + film_main(films, i, portraits) + deepen(shell_bottom)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    issue = ROOT / sys.argv[1]
    source = issue / "production.html"
    page = source.read_text(encoding="utf-8")
    films = read_films(page)

    for start, end, body in (("<!-- films:start -->", "<!-- films:end -->", list_html(films)),
                             ("<!-- wall:start -->", "<!-- wall:end -->", wall_html(films))):
        if start not in page:
            continue  # the poster wall is optional
        a, b = between(page, start, end)
        page = page[:a] + body + page[b:]
    source.write_text(page, encoding="utf-8")

    main_a = page.index("    <main")
    main_b = page.index("</main>") + len("</main>")
    out = issue / "production"
    out.mkdir(exist_ok=True)
    keep = set()
    portraits = load_portraits()
    for i, f in enumerate(films):
        target = out / f"{f['id']}.html"
        target.write_text(film_page(page[:main_a], page[main_b:], films, i, portraits), encoding="utf-8")
        keep.add(target.name)
    for stale in out.glob("film-*.html"):
        if stale.name not in keep:
            stale.unlink()
    print(f"{len(films)} film pages written to {out.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
