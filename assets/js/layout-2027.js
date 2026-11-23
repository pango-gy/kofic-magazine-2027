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
        };
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const DELAY = 7000;
        let current = 0;
        let timer = null;
        let paused = false;

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

            const n = tabs[(current + 1) % tabs.length].dataset;
            next.link.href = n.href;
            next.img.src = n.thumb;
            next.kicker.textContent = n.kicker;
            next.title.textContent = n.title;
            next.deck.textContent = n.deck;
        }

        function schedule() {
            clearTimeout(timer);
            if (paused || reduceMotion || document.hidden) return;
            timer = setTimeout(() => {
                show(current + 1);
                schedule();
            }, DELAY);
        }

        tabs.forEach((tab, i) => tab.addEventListener("click", () => {
            show(i);
            schedule();
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

    function init() {
        initHero();
        markCurrentSection();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
