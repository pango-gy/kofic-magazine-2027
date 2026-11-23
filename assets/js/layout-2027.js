/* Layout 2027 — main-page cover switcher and header menu state. */
(function () {
    "use strict";

    /* Cover hero: the side cards are the story switch. Picking one brings it
       into the main frame; the side then shows the next two stories;
       stories also rotate on a timer unless the reader is interacting. */
    function initHero() {
        const hero = document.querySelector("[data-mk-hero]");
        if (!hero) return;

        const stories = Array.from(hero.querySelectorAll(".mk-hero-story"));
        const imgs = Array.from(hero.querySelectorAll(".mk-hero-media img"));
        if (!stories.length) return;
        const field = (name) => hero.querySelector(`[data-hero-field="${name}"]`);
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const DELAY = 7000;
        const SIDE_COUNT = 2;
        let current = 0;
        let timer = null;
        let paused = false;

        function show(i) {
            current = (i + stories.length) % stories.length;
            const d = stories[current].dataset;

            // The side shows only the next SIDE_COUNT stories, in reading order
            stories.forEach((s, n) => {
                const ahead = (n - current + stories.length) % stories.length;
                s.setAttribute("aria-pressed", String(ahead === 0));
                s.hidden = ahead === 0 || ahead > SIDE_COUNT;
                s.style.order = String(ahead);
                s.dataset.sidePos = String(ahead);
            });
            imgs.forEach((img, n) => img.classList.toggle("is-active", n === current));

            // Fill whichever fields the hero copy currently shows
            const set = (name, fn) => { const el = field(name); if (el) fn(el); };
            set("kicker", (el) => { el.textContent = d.kicker; });
            set("title", (el) => { el.textContent = d.title; el.href = d.href; });
            set("deck", (el) => { el.textContent = d.deck; });
        }

        function schedule() {
            clearTimeout(timer);
            if (paused || reduceMotion || document.hidden) return;
            timer = setTimeout(() => {
                show(current + 1);
                schedule();
            }, DELAY);
        }

        stories.forEach((story, i) => story.addEventListener("click", (e) => {
            show(i);
            schedule();
            // The picked card hides itself; for keyboard users, move focus to
            // the story they just opened instead of dropping it on <body>.
            if (e.detail === 0 && field("title")) field("title").focus();
        }));

        // Pause while the reader is pointing at or focused inside the hero.
        hero.addEventListener("mouseenter", () => { paused = true; schedule(); });
        hero.addEventListener("mouseleave", () => { paused = false; schedule(); });
        hero.addEventListener("focusin", () => { paused = true; schedule(); });
        hero.addEventListener("focusout", (e) => {
            if (!hero.contains(e.relatedTarget)) { paused = false; schedule(); }
        });
        document.addEventListener("visibilitychange", schedule);

        show(0);
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

    /* Box office poster wall: lay the source list out into tilted rows that
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
            const box = wall.closest(".mk-box");
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
        initHero();
        initPosterWall();
        markCurrentSection();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
