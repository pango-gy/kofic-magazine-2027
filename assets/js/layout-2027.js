/* Layout 2027 — main-page cover switcher and header menu state. */
(function () {
    "use strict";

    function initHero() {
        const hero = document.querySelector("[data-mk-hero]");
        if (!hero) return;

        const tabs = Array.from(hero.querySelectorAll(".mk-hero-tab"));
        const imgs = Array.from(hero.querySelectorAll(".mk-hero-media img"));
        const field = (name) => hero.querySelector(`[data-hero-field="${name}"]`);
        const next = {
            link: hero.querySelector("[data-hero-next]"),
            img: hero.querySelector("[data-hero-next-img]"),
            kicker: hero.querySelector("[data-hero-next-kicker]"),
            title: hero.querySelector("[data-hero-next-title]"),
            deck: hero.querySelector("[data-hero-next-deck]"),
            num: hero.querySelector("[data-hero-next-num]"),
        };
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const DELAY = 7000;
        let current = 0;
        let paused = false;

        // The progress bar is the timer: when its fill animation finishes,
        // the next story shows. Pausing the animation pauses the rotation,
        // so the bar always shows exactly how long is left.
        const bar = hero.querySelector(".mk-hero-progress span");
        let fill = null;
        if (bar && !reduceMotion && bar.animate) {
            fill = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DELAY, fill: "forwards" });
            fill.pause();
            fill.onfinish = () => { show(current + 1); restart(); };
        } else if (bar) {
            bar.parentElement.hidden = true;
        }

        function show(i) {
            current = (i + tabs.length) % tabs.length;
            const d = tabs[current].dataset;

            tabs.forEach((t, n) => t.setAttribute("aria-pressed", String(n === current)));
            imgs.forEach((img, n) => img.classList.toggle("is-active", n === current));

            field("kicker").textContent = d.kicker;
            const title = field("title");
            title.textContent = d.title;
            title.href = d.href;
            field("deck").textContent = d.deck;
            field("meta").textContent = d.meta;
            const list = field("points");
            list.replaceChildren(...d.points.split("|").map((p) => {
                const li = document.createElement("li");
                li.textContent = p;
                return li;
            }));

            const nextIndex = (current + 1) % tabs.length;
            const n = tabs[nextIndex].dataset;
            const pad = (v) => String(v).padStart(2, "0");
            if (next.num) next.num.textContent = `${pad(nextIndex + 1)} / ${pad(tabs.length)}`;
            next.link.setAttribute("aria-label", `다음 커버스토리 ${nextIndex + 1}번: ${n.title}`);
            next.link.href = n.href;
            next.img.src = n.thumb;
            next.kicker.textContent = n.kicker;
            next.title.textContent = n.title;
            next.deck.textContent = n.deck;
        }

        // Run or hold the bar depending on hover/focus and tab visibility.
        function schedule() {
            if (!fill) return;
            hero.classList.toggle("is-paused", paused);
            if (paused || document.hidden) fill.pause();
            else fill.play();
        }

        // Start the bar over for the story now showing.
        function restart() {
            if (!fill) return;
            fill.currentTime = 0;
            schedule();
        }

        tabs.forEach((tab, i) => tab.addEventListener("click", () => {
            show(i);
            restart();
        }));

        // Pause while the reader is pointing at or focused inside the hero.
        hero.addEventListener("mouseenter", () => { paused = true; schedule(); });
        hero.addEventListener("mouseleave", () => { paused = false; schedule(); });
        hero.addEventListener("focusin", () => { paused = true; schedule(); });
        hero.addEventListener("focusout", (e) => {
            if (!hero.contains(e.relatedTarget)) { paused = false; schedule(); }
        });
        document.addEventListener("visibilitychange", schedule);

        schedule();
    }

    // list.html: mark the section from ?section= as current in the header nav.
    function markCurrentSection() {
        const nav = document.querySelector(".mk-nav");
        if (!nav || nav.querySelector('[aria-current="page"]')) return;
        const section = new URLSearchParams(location.search).get("section");
        if (!section) return;
        const want = section.replace(/\(ENG\)$/, "");
        nav.querySelectorAll(".mk-nav-link").forEach((a) => {
            const s = new URL(a.href).searchParams.get("section");
            if (s === want) a.setAttribute("aria-current", "page");
        });
    }

    // ---- Data pages (box office, production) -------------------------------

    // Label/value pairs of a film card. Production cards were already turned
    // into .spec-row elements ("감독" / "이창동"); box office cards are plain
    // lines like "개봉일 2026-09-30".
    function cardFields(item) {
        const out = {};
        const rows = item.querySelectorAll(".spec-row");
        if (rows.length) {
            rows.forEach((r) => {
                out[r.querySelector(".spec-k").textContent.trim()] = r.querySelector(".spec-v").textContent.trim();
            });
        } else {
            const text = item.querySelector(".text");
            (text ? text.innerText : "").split("\n").forEach((line) => {
                const m = line.trim().match(/^([^\s:]+)\s*:?\s*(.*)$/);
                if (m && m[2]) out[m[1]] = m[2].trim();
            });
        }
        const titleEl = item.querySelector(".title");
        // Whole text of the title (the page script wraps bracketed words like
        // "암살자(들)" in a span, so the first text node alone can be empty).
        out.title = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
        const img = item.querySelector("img");
        out.img = img ? img.getAttribute("src") : "";
        return out;
    }

    const shortDate = (d) => {
        const m = (d || "").match(/\d{4}-(\d{2})-(\d{2})/);
        return m ? `${m[1]}.${m[2]}` : (d || "—");
    };

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    // Box office: each poster list ("흥행 TOP10", "독립·예술영화 흥행 TOP10")
    // becomes a ranking table.
    // Data pages (mockup BoxOffice / Production): the main tables sit right
    // under the dark/tinted header, above the cover photo and article text.
    function dataBoard() {
        const hero = document.querySelector(".article-hero--data");
        if (!hero) return null;
        let board = document.querySelector(".data-board");
        if (!board) {
            board = el("section", "data-board");
            board.setAttribute("aria-label", "주요 표");
            hero.after(board);
        }
        return board;
    }

    // Films covered by an article in this issue (for "이번 주 순위 속 웹진 기사")
    const CHART_ARTICLES = {
        "실낙원": { href: "./reading-2.html", title: "낙원 없이 살아가는 법 — 〈실낙원〉 YES or NO" },
        "가능한 사랑": { href: "./reading-1.html", title: "미옥과 호석의 내일을 위한 시간 — 〈가능한 사랑〉" },
        "부활남: 더 레드": { href: "./people-2.html", title: "엉뚱하지만 파괴적인 — 〈부활남: 더 레드〉 정성호 무술감독" },
    };

    function initBoxOfficeTables() {
        if (!/\/boxoffice-\d\.html$/.test(location.pathname)) return;
        const board = dataBoard();
        let index = 0;
        document.querySelectorAll(".article-main .common-list-3").forEach((list) => {
            const items = Array.from(list.querySelectorAll(".item"));
            if (!items.length) return;
            const head = list.previousElementSibling;
            const caption = head && head.classList.contains("common-title-3") ? head.textContent.trim() : "흥행 순위";

            const wrap = el("div", "data-table-wrap");
            const table = el("table", "data-table data-table--rank");
            table.append(el("caption", "mk-sr", caption));
            const thead = el("thead");
            const hr = el("tr");
            ["순위", "영화", "관객수", "매출액", "개봉일"].forEach((t) => {
                const th = el("th", null, t);
                th.scope = "col";
                hr.append(th);
            });
            thead.append(hr);
            const tbody = el("tbody");
            items.forEach((item, i) => {
                const f = cardFields(item);
                const tr = el("tr", i < 3 ? "is-top" : "");
                tr.append(el("td", "c-rank", String(i + 1)));
                const film = el("th", "c-film");
                film.scope = "row";
                if (f.img) {
                    const im = el("img");
                    im.src = f.img;
                    im.alt = "";
                    im.loading = "lazy";
                    film.append(im);
                }
                film.append(el("span", null, f.title));
                tr.append(film);
                tr.append(el("td", "c-num", f["관객수"] || "—"));
                tr.append(el("td", "c-num", f["매출액"] || "—"));
                tr.append(el("td", "c-date", shortDate(f["개봉일"])));
                tbody.append(tr);
            });
            table.append(thead, tbody);
            wrap.append(table);
            list.style.display = "none";
            if (board && index === 1) {
                // 독립·예술영화: ranked cards like the mockup — TOP 5 shown,
                // 6–10위 behind a button — plus links to this issue's articles
                // about films in this week's charts.
                const col = el("div", "data-board-side");
                col.append(el("h2", "data-board-title", "독립·예술영화 TOP 5"));
                const ol = el("ol", "indie-rank");
                const fields = items.map(cardFields);
                fields.forEach((f, i) => {
                    const li = el("li", i >= 5 ? "is-more" : "");
                    if (i >= 5) li.hidden = true;
                    li.append(el("span", "indie-num", String(i + 1)));
                    const body = el("span", "indie-body");
                    body.append(el("span", "indie-title", f.title));
                    // Indie figures come as "20천 명"; show them as "2만 명" / "1만 8천 명".
                    const people = (f["관객수"] || "").replace(/^(\d+)천\s*명$/, (m, k) => {
                        const n = Number(k);
                        return n >= 10 ? `${Math.floor(n / 10)}만${n % 10 ? ` ${n % 10}천` : ""} 명` : m;
                    });
                    const meta = [people && `관객 ${people}`, f["개봉일"] && `${shortDate(f["개봉일"])} 개봉`].filter(Boolean).join(" · ");
                    body.append(el("span", "indie-meta", meta));
                    li.append(body);
                    ol.append(li);
                });
                col.append(ol);
                if (fields.length > 5) {
                    const more = el("button", "indie-more", `6~${fields.length}위 보기`);
                    more.type = "button";
                    more.setAttribute("aria-expanded", "false");
                    more.addEventListener("click", () => {
                        const open = more.getAttribute("aria-expanded") !== "true";
                        ol.querySelectorAll(".is-more").forEach((li) => { li.hidden = !open; });
                        more.setAttribute("aria-expanded", String(open));
                        more.textContent = open ? "접기" : `6~${fields.length}위 보기`;
                    });
                    col.append(more);
                }
                // Films in either chart that this issue wrote about
                const charted = new Set();
                document.querySelectorAll(".article-main .common-list-3 .item").forEach((it) => charted.add(cardFields(it).title));
                Object.entries(CHART_ARTICLES).forEach(([film, a]) => {
                    if (!charted.has(film)) return;
                    const link = el("a", "indie-article");
                    link.href = a.href;
                    link.append(el("span", "indie-article-label", "이번 주 순위 속 웹진 기사"), el("span", "indie-article-title", a.title));
                    col.append(link);
                });
                board.append(col);
                if (head && head.classList.contains("common-title-3")) head.style.display = "none";
            } else if (board) {
                // First list = 흥행 TOP10 (wide column)
                const col = el("div", "data-board-main");
                col.append(el("h2", "data-board-title", caption), wrap);
                board.append(col);
                if (head && head.classList.contains("common-title-3")) head.style.display = "none";
            } else {
                list.after(wrap);
            }
            index++;
        });
    }

    // Production: the 23 film cards become one table with genre filters; the
    // wide legacy 제작상황판 table folds into "상세 보기".
    const WEBZINE_LINKS = {
        "가능한 사랑": "./reading-1.html",
        "부활남: 더 레드": "./people-2.html",
    };
    const GENRES = [
        ["드라마", /드라마/],
        ["다큐멘터리", /다큐/],
        ["액션·스릴러", /액션|스릴러/],
        ["코미디", /코미디/],
        ["애니메이션", /애니/],
    ];

    function initProductionTable() {
        if (!/\/production\.html$/.test(location.pathname)) return;
        const list = document.querySelector(".article-main .common-list-3");
        if (!list) return;
        const films = Array.from(list.querySelectorAll(".item")).map(cardFields);
        if (!films.length) return;

        const box = el("div", "prod-board");
        const bar = el("div", "prod-filter");
        const group = el("div", "prod-filter-pills");
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "장르 필터");
        const note = el("span", "prod-filter-note");
        note.append(el("span", "prod-tag", "웹진 기사"), " 표시는 웹진에서 다룬 작품");
        bar.append(group, note);

        const wrap = el("div", "data-table-wrap");
        const table = el("table", "data-table data-table--prod");
        table.append(el("caption", "mk-sr", `2026년 9월 개봉 한국영화 ${films.length}편`));
        const thead = el("thead");
        const hr = el("tr");
        ["개봉일", "영화", "장르", "감독", "주요 출연"].forEach((t) => {
            const th = el("th", null, t);
            th.scope = "col";
            hr.append(th);
        });
        thead.append(hr);
        const tbody = el("tbody");
        const rows = films.map((f) => {
            const tr = el("tr");
            tr.dataset.genre = f["장르"] || "";
            tr.append(el("td", "c-date", shortDate(f["개봉일"])));
            const film = el("th", "c-film");
            film.scope = "row";
            film.append(el("span", null, f.title));
            if (WEBZINE_LINKS[f.title]) {
                const a = el("a", "prod-tag", "웹진 기사");
                a.href = WEBZINE_LINKS[f.title];
                a.setAttribute("aria-label", `${f.title} 웹진 기사 보기`);
                film.append(" ", a);
            }
            tr.append(film);
            tr.append(el("td", null, f["장르"] || "—"));
            tr.append(el("td", null, f["감독"] || "—"));
            const cast = (f["캐스팅"] || "").split(",").map((s) => s.trim()).filter(Boolean);
            tr.append(el("td", "c-cast", cast.length ? cast.slice(0, 3).join(", ") + (cast.length > 3 ? " 외" : "") : "—"));
            tbody.append(tr);
            return tr;
        });
        table.append(thead, tbody);
        wrap.append(table);

        const pills = [["전체", null], ...GENRES].map(([label, re]) => {
            const b = el("button", "prod-pill");
            b.type = "button";
            const count = re ? rows.filter((r) => re.test(r.dataset.genre)).length : rows.length;
            b.textContent = label;
            b.append(" ", el("span", "prod-pill-count", String(count)));
            b.setAttribute("aria-pressed", String(!re));
            b.addEventListener("click", () => {
                pills.forEach((p) => p.setAttribute("aria-pressed", String(p === b)));
                rows.forEach((r) => { r.hidden = !!re && !re.test(r.dataset.genre); });
            });
            group.append(b);
            return b;
        });

        box.append(bar, wrap);
        list.style.display = "none";
        const board = dataBoard();
        if (board) {
            board.classList.add("data-board--prod");
            board.append(box);
        } else {
            list.after(box);
        }

        // Fold the full 제작상황판 (all columns) into a details block.
        const legacy = document.querySelector(".article-main .common-table-1");
        if (legacy) {
            const title = legacy.previousElementSibling;
            const details = el("details", "prod-details");
            const summary = el("summary", null, "제작상황판 상세 보기");
            summary.append(el("span", "prod-details-hint", "제작사·배급사·제작연도 등 전체 항목"));
            legacy.before(details);
            details.append(summary);
            if (title && title.classList.contains("n-common-title-2")) details.append(title);
            details.append(legacy);
            if (board) board.append(details);
        }
    }

    // Article byline as one line like the mockup: "글 김혜선(…) · 사진 강건(…)"
    // instead of "글 _ 김혜선(…)" on separate lines.
    function initByline() {
        // Role words that start a new credit ("사진 _ …", "대담 _ …", "Photos …").
        const ROLE = /\s+(?=(?:사진|진행|대담|그림|번역|Photos?|Translated)\s)/g;
        document.querySelectorAll(".article-credits > span").forEach((span) => {
            span.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
            const text = span.textContent
                .replace(/ /g, " ")
                .replace(/\s*_\s*/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .replace(ROLE, " · ")
                .replace(/,\s*·/g, ",")
                .replace(/(·\s*){2,}/g, "· ");
            span.textContent = text;
        });
    }

    // ---- Mobile menu (mockup MobileMenu) ----------------------------------
    // The ☰ button used to open the same 목차·검색 drawer as the search icon.
    // It now opens its own menu: the section list and two quick links.
    // The search icon keeps opening the search drawer.
    const MENU_SECTIONS = ["SPECIAL", "INTERVIEW", "CRITIC", "GLOBAL", "KOFIC STORY", "BOX OFFICE", "PRODUCTION"];

    function initMobileMenu() {
        const oldBtn = document.querySelector(".mk-menu-btn");
        const brand = document.querySelector(".mk-brand");
        if (!oldBtn || !brand) return;
        const root = brand.getAttribute("href").replace(/index\.html$/, "");
        const logo = brand.querySelector("img");

        // Replace the button so the drawer's click handler no longer fires.
        const btn = oldBtn.cloneNode(true);
        btn.removeAttribute("data-open-drawer");
        btn.setAttribute("aria-label", "메뉴 열기");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", "mkMenu");
        oldBtn.replaceWith(btn);

        const current = (document.querySelector(".mk-nav-link[aria-current='page']") || {}).textContent;

        const panel = el("div", "mk-menu");
        panel.id = "mkMenu";
        panel.hidden = true;
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-label", "메뉴");

        const top = el("div", "mk-menu-top");
        const home = el("a", "mk-menu-logo");
        home.href = root + "index.html";
        home.setAttribute("aria-label", "웹진 한국영화 홈");
        const img = el("img");
        img.src = logo.getAttribute("src");
        img.alt = "웹진 한국영화";
        home.append(img);
        const close = el("button", "mk-menu-close");
        close.type = "button";
        close.setAttribute("aria-label", "메뉴 닫기");
        close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        top.append(home, close);

        const nav = el("nav", "mk-menu-nav");
        nav.setAttribute("aria-label", "주요 섹션");
        const ul = el("ul");
        MENU_SECTIONS.forEach((name) => {
            const li = el("li");
            const a = el("a");
            a.href = root + "list.html?section=" + encodeURIComponent(name);
            if (name === current) a.setAttribute("aria-current", "page");
            a.append(el("span", "mk-menu-name", name));
            li.append(a);
            ul.append(li);
        });
        nav.append(ul);

        const quick = el("ul", "mk-menu-quick");
        const all = el("a", null, "전체 기사");
        all.href = root + "list.html";
        const news = el("button", "is-accent", "뉴스레터 구독");
        news.type = "button";
        news.addEventListener("click", () => {
            const modal = document.getElementById("modalNewsletter");
            closeMenu(false);
            if (modal) {
                modal.classList.add("is-open");
                modal.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
                const first = modal.querySelector("input");
                if (first) setTimeout(() => first.focus(), 60);
            }
        });
        [all, news].forEach((x) => { const li = el("li"); li.append(x); quick.append(li); });

        panel.append(top, nav, quick);
        document.body.append(panel);

        function openMenu() {
            panel.hidden = false;
            btn.setAttribute("aria-expanded", "true");
            document.body.style.overflow = "hidden";
            requestAnimationFrame(() => panel.classList.add("is-open"));
            setTimeout(() => close.focus({ preventScroll: true }), 60);
        }
        function closeMenu(returnFocus = true) {
            panel.classList.remove("is-open");
            panel.hidden = true;
            btn.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
            if (returnFocus) btn.focus();
        }
        btn.addEventListener("click", openMenu);
        close.addEventListener("click", () => closeMenu());
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !panel.hidden) closeMenu();
        });
        // Leaving for the PC layout closes the menu
        window.matchMedia("(min-width: 1101px)").addEventListener("change", (e) => {
            if (e.matches && !panel.hidden) closeMenu(false);
        });
    }

    function init() {
        initByline();
        initHero();
        markCurrentSection();
        initMobileMenu();   // after markCurrentSection so list.html marks its section
        initBoxOfficeTables();
        initProductionTable();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
