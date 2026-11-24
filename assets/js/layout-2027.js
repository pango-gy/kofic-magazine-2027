/* Layout 2027 — header menu state, cover lockup line breaks and the box office poster wall. */
(function () {
    "use strict";

    /* Cover lockups: choose where each Korean title breaks so the lines form
       a staircase with the English section name on top. Every line should be
       wider than the one above it, by steps as even as possible. Candidates
       are "no break" and "break after word k"; ones that overflow the card
       are dropped, and the rest are scored (narrower-than-above costs most,
       then uneven steps; a single line that nearly fills the card is avoided).
       Only if no break fits at all is the title shrunk onto one line. Runs again when the layout or the fonts change. */
    function initCoverLockups() {
        const cards = Array.from(document.querySelectorAll(".mk-cover-card"));
        if (!cards.length) return;
        const MIN_STEP = 14;
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;padding:0;background:none";
        const widthIn = (host, text) => {
            host.append(probe);
            probe.textContent = text;
            const w = probe.getBoundingClientRect().width;
            probe.remove();
            return w;
        };

        function layout(card) {
            if (card.dataset.kind === "plain") return;   // text under the photo wraps naturally
            const box = card.querySelector(".mk-cover-card-text");
            const en = card.querySelector(".mk-cover-card-title .mk-cover-card-en > span");
            const ko = card.querySelector(".mk-cover-card-title .mk-cover-card-ko > span");
            if (!box || !ko) return;   // tiles below the cover may have no English line
            const copies = Array.from(card.querySelectorAll(".mk-cover-card-ko > span"));
            const blocks = Array.from(card.querySelectorAll(".mk-cover-card-shape, .mk-cover-card-title"));
            blocks.forEach((el) => el.style.removeProperty("--ko"));
            const full = ko.dataset.full || ko.textContent.replace(/\s+/g, " ").trim();
            copies.forEach((el) => { el.dataset.full = full; });
            const words = full.split(" ");

            const cs = getComputedStyle(ko);
            const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
            const max = getComputedStyle(box).maxWidth;
            const limit = (max.endsWith("%") ? card.clientWidth * parseFloat(max) / 100 : parseFloat(max) || card.clientWidth) - pad;
            const enWidth = en ? widthIn(en.parentElement, en.textContent.trim()) : 0;
            const koHost = ko.parentElement;

            // Candidates: one line, two lines (break after word a), three lines
            // (breaks after words a and b)
            const options = [[full]];
            for (let a = 1; a < words.length; a++) {
                options.push([words.slice(0, a).join(" "), words.slice(a).join(" ")]);
                for (let b = a + 1; b < words.length; b++) {
                    options.push([words.slice(0, a).join(" "), words.slice(a, b).join(" "), words.slice(b).join(" ")]);
                }
            }
            let best = null;
            for (const lines of options) {
                const widths = lines.map((line) => widthIn(koHost, line));
                if (Math.max(...widths) > limit) continue;
                const seq = [enWidth, ...widths];
                const steps = seq.slice(1).map((w, i) => w - seq[i]);
                const shortfall = steps.reduce((sum, d) => sum + Math.max(0, MIN_STEP - d), 0);
                const uneven = steps.length > 1 ? Math.max(...steps) - Math.min(...steps) : steps[0];
                // A single line that nearly fills the card looks crammed; a third
                // line is a last resort
                const crammed = lines.length === 1 && widths[0] > limit * 0.72 ? 5000 : 0;
                const extra = lines.length === 3 ? 400 : 0;
                const score = shortfall * 100 + uneven + crammed + extra;
                if (!best || score < best.score) best = { score, lines, shortfall };
            }
            // Nothing fits even on three lines: shrink the title onto one line
            if (!best) {
                const whole = widthIn(koHost, full);
                const scale = limit / whole;
                if (scale < 1 && scale >= 0.86 && whole * scale - enWidth >= MIN_STEP) {
                    const size = Math.floor(parseFloat(getComputedStyle(koHost).fontSize) * scale * 10) / 10;
                    blocks.forEach((el) => el.style.setProperty("--ko", size + "px"));
                    best = { lines: [full] };
                }
            }
            copies.forEach((el) => {
                el.parentElement.classList.toggle("is-set", Boolean(best));
                el.textContent = "";
                if (!best) { el.textContent = full; return; }   // nothing fits: natural wrapping
                best.lines.forEach((line, i) => {
                    if (i) el.append(document.createElement("br"));
                    el.append(line);
                });
            });
        }

        const run = () => cards.forEach(layout);
        // The lockups are hidden (CSS) until the breaks are final: lay out
        // once now, once more when the web font is in, then reveal.
        const grid = document.querySelector(".mk-cover-grid");
        const reveal = () => { run(); if (grid) grid.classList.add("is-ready"); };
        run();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(reveal);
        else reveal();
        let timer = null;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(run, 150);
        });
    }

    /* Production table (production.html): the status board lists every film
       in one 170-row table, grouped by a tall "구분" cell. Turn those groups
       into tabs and show one group at a time. Without this script the full
       table stays as it is. */
    function initProdTable() {
        const table = document.querySelector(".mk-prod-table .common-table-1 table");
        if (!table || !table.tBodies.length) return;
        const groups = [];
        Array.from(table.tBodies[0].rows).forEach((row) => {
            const head = row.querySelector("td[rowspan]");
            if (head) {
                groups.push({ label: head.textContent.replace(/\s+/g, " ").trim().replace(/(\d+월)\s*개봉/, "$1 개봉"), rows: [] });
                head.classList.add("mk-ptable-group");
            }
            if (groups.length) groups[groups.length - 1].rows.push(row);
        });
        // The film-title column stays put while the table scrolls sideways.
        // It is the 16th cell from the end (the first row of a group has one
        // extra cell in front, so counting from the start would be off).
        Array.from(table.rows).forEach((row) => {
            const cell = row.cells[row.cells.length - 16];
            if (cell) cell.classList.add("mk-ptable-name");
        });
        if (groups.length < 2) return;
        const firstHead = table.tHead && table.tHead.rows[0] && table.tHead.rows[0].cells[0];
        if (firstHead) firstHead.classList.add("mk-ptable-group");

        const tabs = document.createElement("div");
        tabs.className = "mk-ptable-tabs";
        tabs.setAttribute("role", "group");
        tabs.setAttribute("aria-label", "제작 단계별로 보기");
        const buttons = groups.map((group, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.append(group.label);
            const count = document.createElement("span");
            count.textContent = group.rows.length + "편";
            btn.append(count);
            btn.addEventListener("click", () => show(i));
            tabs.append(btn);
            return btn;
        });
        const box = table.closest(".common-table-1");
        box.before(tabs);
        box.classList.add("is-tabbed");

        function show(index) {
            groups.forEach((group, i) => group.rows.forEach((row) => { row.hidden = i !== index; }));
            buttons.forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === index)));
            box.scrollLeft = 0;
        }
        show(0);
    }

    /* Wide table, sticky scrollbar: the table's own horizontal scrollbar sits
       at its foot, out of sight on a tall table. A second bar under the table
       stays pinned to the bottom of the window until the table's foot comes
       into view, and the two are kept in step. */
    function initStickyTableScroll() {
        const box = document.querySelector(".mk-prod-table .common-table-1");
        const table = box && box.querySelector("table");
        if (!table) return;
        const wrap = document.createElement("div");
        wrap.className = "mk-ptable-wrap";
        box.before(wrap);
        const bar = document.createElement("div");
        bar.className = "mk-ptable-scroll";
        bar.setAttribute("aria-hidden", "true");
        const spacer = document.createElement("div");
        bar.append(spacer);
        wrap.append(box, bar);

        const measure = () => {
            spacer.style.inlineSize = table.scrollWidth + "px";
            bar.hidden = box.scrollWidth <= box.clientWidth + 1;
        };
        let lock = false;
        const link = (from, to) => from.addEventListener("scroll", () => {
            if (lock) { lock = false; return; }
            if (to.scrollLeft !== from.scrollLeft) { lock = true; to.scrollLeft = from.scrollLeft; }
        }, { passive: true });
        link(bar, box);
        link(box, bar);
        // While the bar is pinned (the table's foot is still below the window),
        // mark it so CSS can shade the edge where the table is cut off.
        const end = document.createElement("div");
        wrap.append(end);
        if ("IntersectionObserver" in window) {
            new IntersectionObserver((entries) => {
                const e = entries[0];
                bar.classList.toggle("is-pinned", !e.isIntersecting && e.boundingClientRect.top > 0);
            }).observe(end);
        }
        measure();
        if ("ResizeObserver" in window) new ResizeObserver(measure).observe(table);
        window.addEventListener("resize", measure);
    }

    /* Article contents rail: on wide screens the table of contents (built by
       magazine-2027.js as a closed <details>) sits in the right margin of the
       centred text column and stays in view; open it there and mark the
       section being read. On narrower screens it stays the collapsed line
       above the text (and closes again if the window is narrowed). */
    /* Quick menu (every page) and, on article pages, the reading tools that
       follow the reader down the left margin. Everything in them is a link or
       a button that stands in for a control already on the page. */
    const QUICK_INSTAGRAM = "https://www.instagram.com/";   // placeholder: put the magazine's account here
    function quickItems() {
        const frag = document.createDocumentFragment();
        const add = (el, text) => { el.className = "mk-quick-item"; el.textContent = text; frag.appendChild(el); return el; };
        const ig = add(document.createElement("a"), "인스타그램");
        ig.href = QUICK_INSTAGRAM; ig.target = "_blank"; ig.rel = "noopener";
        [["modalOpinion", "독자의견"], ["modalNewsletter", "뉴스레터 신청"]].forEach(([id, text]) => {
            const opener = document.querySelector(`.ed-footer [data-open-modal="${id}"]`);
            if (!opener) return;
            const b = add(document.createElement("button"), text);
            b.type = "button";
            b.addEventListener("click", () => opener.click());
        });
        const top = add(document.createElement("button"), "맨 위로 ↑");
        top.type = "button";
        top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        return frag;
    }
    function initQuickMenu() {
        const box = document.createElement("nav");
        box.className = "mk-quick";
        box.setAttribute("aria-label", "퀵 메뉴");
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "mk-quick-toggle";
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Quick Menu";
        const list = document.createElement("div");
        list.className = "mk-quick-list";
        list.appendChild(quickItems());
        toggle.addEventListener("click", () => {
            const open = box.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
        box.append(toggle, list);
        document.body.appendChild(box);
    }
    function initReadRail() {
        const main = document.querySelector(".article-main:not(.mk-prod-table)");
        const sizeBtns = Array.from(document.querySelectorAll(".reader-toolbar [data-set-scale]"));
        if (!main || !sizeBtns.length) return;
        const rail = document.createElement("aside");
        rail.className = "mk-rail";
        rail.setAttribute("aria-label", "읽기 도구");

        const tools = document.createElement("div");
        tools.className = "mk-rail-group";
        const label = document.createElement("span");
        label.className = "mk-rail-label";
        label.textContent = "글자 크기";
        const sizes = document.createElement("div");
        sizes.className = "mk-rail-sizes";
        const mine = sizeBtns.map((src) => {
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.scale = src.dataset.setScale;
            b.textContent = "가";
            b.setAttribute("aria-label", src.getAttribute("aria-label") || "글자 크기");
            b.addEventListener("click", () => src.click());
            sizes.appendChild(b);
            return b;
        });
        const sync = () => {
            const cur = document.documentElement.getAttribute("data-font-scale") || "md";
            mine.forEach((b) => {
                const on = b.dataset.scale === cur;
                b.classList.toggle("is-active", on);
                b.setAttribute("aria-pressed", on ? "true" : "false");
            });
        };
        new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-font-scale"] });
        sync();
        tools.append(label, sizes);
        const copySrc = document.querySelector(".reader-toolbar [data-copy-link]");
        if (copySrc) {
            const copy = document.createElement("button");
            copy.type = "button";
            copy.className = "mk-quick-item";
            copy.textContent = "링크 복사";
            copy.addEventListener("click", () => copySrc.click());
            tools.appendChild(copy);
        }

        rail.append(tools);
        main.appendChild(rail);
        document.body.classList.add("has-read-rail");
    }

    /* Wide data tables with grouped columns (weekly box office: 전체 / 한국 /
       외국) cannot fit a phone. Build one small table per group from the same
       cells — period + that group's columns — and show those on phones in
       place of the wide table (CSS switches between the two). */
    function initSplitTables() {
        document.querySelectorAll(".article-main .common-table-2").forEach((box) => {
            const table = box.querySelector("table");
            if (!table || !table.tHead || table.tHead.rows.length < 2 || box.nextElementSibling?.classList.contains("mk-tsplit")) return;
            const top = Array.from(table.tHead.rows[0].cells);
            const sub = Array.from(table.tHead.rows[1].cells).map((th) => th.textContent.trim());
            const lead = top[0].textContent.trim();
            const groups = [];
            let at = 0;
            top.slice(1).forEach((th) => {
                const span = th.colSpan || 1;
                groups.push({ name: th.textContent.trim(), from: at, to: at + span });
                at += span;
            });
            if (!groups.length || at !== sub.length) return;
            const wrap = document.createElement("div");
            wrap.className = "mk-tsplit";
            groups.forEach((g) => {
                const t = document.createElement("table");
                const cap = t.createCaption();
                cap.textContent = g.name;
                const hr = t.createTHead().insertRow();
                [lead].concat(sub.slice(g.from, g.to)).forEach((text) => {
                    const th = document.createElement("th");
                    th.scope = "col";
                    th.textContent = text.replace(/\s*\(/, " (");
                    hr.appendChild(th);
                });
                const body = t.createTBody();
                Array.from(table.tBodies[0].rows).forEach((row) => {
                    const cells = Array.from(row.cells);
                    const r = body.insertRow();
                    const th = document.createElement("th");
                    th.scope = "row";
                    th.textContent = cells[0].textContent.trim();
                    r.appendChild(th);
                    cells.slice(1 + g.from, 1 + g.to).forEach((td) => { r.insertCell().textContent = td.textContent.trim(); });
                });
                wrap.appendChild(t);
            });
            box.insertAdjacentElement("afterend", wrap);
            box.classList.add("has-tsplit");
        });
    }

    /* The section menu scrolls sideways when it does not fit. A finger swipes it
       natively; a mouse cannot — so let the mouse drag it too (and do not treat
       the end of a drag as a click on a link). */
    function initNavDrag() {
        const track = document.querySelector(".mk-nav-track");
        if (!track) return;
        let startX = 0, startLeft = 0, down = false, moved = false;
        track.addEventListener("pointerdown", (e) => {
            if (e.pointerType !== "mouse" || e.button !== 0 || track.scrollWidth <= track.clientWidth) return;
            down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
        });
        window.addEventListener("pointermove", (e) => {
            if (!down) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 4) { moved = true; track.classList.add("is-dragging"); }
            if (moved) track.scrollLeft = startLeft - dx;
        });
        const end = () => { if (!down) return; down = false; setTimeout(() => track.classList.remove("is-dragging"), 0); };
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
        track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
        track.addEventListener("dragstart", (e) => e.preventDefault());
        // a vertical mouse wheel over the strip moves it sideways
        track.addEventListener("wheel", (e) => {
            if (track.scrollWidth <= track.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            const before = track.scrollLeft;
            track.scrollLeft += e.deltaY;
            if (track.scrollLeft !== before) e.preventDefault();
        }, { passive: false });
    }

    function initArticleToc() {
        const main = document.querySelector(".article-main:not(.mk-prod-table)");
        if (!main) return;
        const wide = window.matchMedia("(min-width: 1500px)");   // same breakpoint as the CSS rail
        let tries = 0;
        (function setup() {
            const toc = main.querySelector(":scope > .ed-toc");
            if (!toc) { if (tries++ < 20) setTimeout(setup, 100); return; }
            main.classList.add("has-toc-rail");
            const links = Array.from(toc.querySelectorAll("a[href^='#']"));
            const targets = links.map((a) => document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))));
            const apply = () => { toc.open = wide.matches; };
            apply();
            wide.addEventListener("change", apply);
            // On the rail the heading is a label, not a toggle
            toc.querySelector("summary").addEventListener("click", (e) => { if (wide.matches) e.preventDefault(); });
            let frame = 0;
            const mark = () => {
                let current = -1;
                targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < 170) current = i; });
                links.forEach((a, i) => a.classList.toggle("is-current", i === current));
            };
            window.addEventListener("scroll", () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(mark); }, { passive: true });
            mark();
        })();
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

    /* On phones the section menu is one line that scrolls sideways: bring the
       current section into view instead of leaving it off the right edge. */
    function revealCurrentSection() {
        const track = document.querySelector(".mk-nav-track");
        const cur = track && track.querySelector('[aria-current="page"]');
        if (!cur || track.scrollWidth <= track.clientWidth) return;
        track.scrollLeft = Math.max(0, cur.offsetLeft - (track.clientWidth - cur.offsetWidth) / 2);
    }

    /* Poster wall (Production stage): lay the source list out into tilted rows that
       fill the whole section. Rows and posters per row follow the wall's
       size. Films are placed row by row from the top, so every film shows
       once before any repeats, and a repeat only lands far below where that
       film first appeared (in the dimmed lower part). Rows sway back and
       forth in CSS instead of looping, so nothing is duplicated for that. */
    function initPosterWall() {
        const src = document.querySelector("[data-mk-wall]");
        if (!src) return;
        const films = Array.from(src.children);
        if (!films.length) return;
        const wall = src.parentElement;
        src.remove();

        let layout = "";

        function build() {
            const css = getComputedStyle(wall);
            const box = wall.closest(".mk-prod-stage, .mk-box");
            const poster = parseFloat(getComputedStyle(box).getPropertyValue("--wall-poster")) || 176;
            const gap = parseFloat(css.rowGap) || 14;
            const posterH = poster * (262 / 183);
            const rows = Math.ceil(wall.offsetHeight / (posterH + gap));
            /* +2 covers the half-poster offset of even rows and the sway */
            const perRow = Math.ceil(wall.offsetWidth / (poster + gap)) + 2;
            const key = rows + "x" + perRow;
            if (key === layout) return;
            layout = key;

            /* Rows in the wall's top bleed sit above the section; fill them
               last so this week's films land in the first visible rows */
            const hidden = Math.floor(parseFloat(css.top) * -1 / (posterH + gap)) || 0;
            const frag = document.createDocumentFragment();
            for (let r = 0; r < rows; r++) {
                const order = (r - hidden + rows) % rows;
                const row = document.createElement("div");
                row.className = "mk-box-wall-row";
                const track = document.createElement("ul");
                track.className = "mk-box-wall-track";
                for (let i = 0; i < perRow; i++) {
                    const li = films[(order * perRow + i) % films.length].cloneNode(true);
                    li.className = "mk-box-poster";
                    track.append(li);
                }
                row.append(track);
                frag.append(row);
            }
            wall.replaceChildren(frag);
        }

        build();
        let timer = null;
        window.addEventListener("resize", () => {
            clearTimeout(timer);
            timer = setTimeout(build, 200);
        });
    }

    function init() {
        initPosterWall();
        initCoverLockups();
        initArticleToc();
        initNavDrag();
        initSplitTables();
        initQuickMenu();
        initReadRail();
        initProdTable();
        initStickyTableScroll();
        markCurrentSection();
        revealCurrentSection();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
