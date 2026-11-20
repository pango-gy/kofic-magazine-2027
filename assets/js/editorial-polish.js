/* ==========================================================================
   웹진 <한국영화> 2027 — Editorial Polish Enhancements
   Zero-dependency vanilla JS: compact sticky header, scroll progress fallback,
   estimated reading time, 3-step font scale, collapsible TOC, prev/next nav,
   and keyboard accessibility.
   ========================================================================== */
(function () {
    if (window.__edPolishInit) return;
    window.__edPolishInit = true;

    const ISSUE_ARTICLES = [
        { file: "special-2.html", section: "SPECIAL", title: "진실 기록 넘어 사회 변화로" },
        { file: "special-1.html", section: "SPECIAL", title: "새로운 영화·영상 제작 거점으로의 출발" },
        { file: "people-2.html", section: "INTERVIEW", title: "엉뚱하지만 파괴적인" },
        { file: "people-1.html", section: "INTERVIEW", title: "인간다움과 인간다운 죽음에 대하여" },
        { file: "reading-2.html", section: "CRITIC", title: "낙원 없이 살아가는 법" },
        { file: "reading-1.html", section: "CRITIC", title: "미옥과 호석의 내일을 위한 시간" },
        { file: "global.html", section: "GLOBAL", title: "도시 전체와 호흡하는 축제로" },
        { file: "global-eng.html", section: "GLOBAL(ENG)", title: "A Festival in Step with an Entire City" },
        { file: "kofic-story.html", section: "KOFIC STORY", title: "창작자, 어떤 판 위에서 놀게 할 것인가" },
        { file: "boxoffice-5.html", section: "BOX OFFICE", title: "10월 5주차 위클리 박스오피스" },
        { file: "boxoffice-4.html", section: "BOX OFFICE", title: "10월 4주차 위클리 박스오피스" },
        { file: "boxoffice-3.html", section: "BOX OFFICE", title: "10월 3주차 위클리 박스오피스" },
        { file: "boxoffice-2.html", section: "BOX OFFICE", title: "10월 2주차 위클리 박스오피스" },
        { file: "boxoffice-1.html", section: "BOX OFFICE", title: "10월 1주차 위클리 박스오피스" },
        { file: "production.html", section: "PRODUCTION", title: "9월 개봉작 살펴보기" }
    ];

    function init() {
        const body = document.body;
        const header = document.querySelector(".header");
        const content = document.querySelector(".content");
        const isArticle = !!document.querySelector(".sub-view-content");
        const rootPrefix = (document.querySelector(".header-logo")?.getAttribute("href") || "./index.html").replace(/index\.html$/, "");

        if (isArticle) {
            body.classList.add("ed-has-article");
        }

        // 1. Accessible Skip Link
        if (content && !document.querySelector(".ed-skip-link")) {
            if (!content.id) content.id = "main-content";
            const skip = document.createElement("a");
            skip.className = "ed-skip-link";
            skip.href = "#" + content.id;
            skip.textContent = "본문 바로가기";
            body.insertBefore(skip, body.firstChild);
        }

        // 2. Keyboard Accessibility for GNB Dropdowns & Tags
        document.querySelectorAll(".header-depth1").forEach((item) => {
            item.addEventListener("focusin", () => {
                document.querySelectorAll(".header-depth1").forEach((other) => {
                    if (other !== item) other.classList.remove("is-active");
                });
                item.classList.add("is-active");
            });
            item.addEventListener("focusout", (e) => {
                if (!item.contains(e.relatedTarget)) {
                    item.classList.remove("is-active");
                }
            });
        });

        document.querySelectorAll(".common-tag-list span, .common-tags-2 span").forEach((tag) => {
            tag.setAttribute("tabindex", "0");
            tag.setAttribute("role", "link");
            tag.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    tag.click();
                }
            });
        });

        // 3. Compact Sticky Header (Desktop) & Auto-Hide (Mobile)
        if (header) {
            let lastY = window.scrollY;
            let rafPending = false;
            const mobileMq = window.matchMedia("(max-width: 780px)");

            function updateHeader() {
                rafPending = false;
                const fullMenuOpen = document.querySelector(".full-menu")?.style.display === "block";
                if (fullMenuOpen || header.matches(":focus-within")) return;

                const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
                const y = Math.max(0, Math.min(window.scrollY, maxScroll));

                if (mobileMq.matches) {
                    header.classList.remove("is-compact");
                    if (y > lastY && y > 120) {
                        header.classList.add("is-hidden");
                    } else if (y < lastY || y <= 40) {
                        header.classList.remove("is-hidden");
                    }
                } else {
                    header.classList.remove("is-hidden");
                    if (y > 80) {
                        header.classList.add("is-compact");
                    } else if (y < 40) {
                        header.classList.remove("is-compact");
                    }
                }
                lastY = y;
            }

            window.addEventListener("scroll", () => {
                if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(updateHeader);
                }
            }, { passive: true });
            updateHeader();
        }

        // 4. Scroll Progress Bar Fallback (when CSS scroll-timeline is unsupported)
        if (isArticle && !(window.CSS && CSS.supports("animation-timeline", "scroll()"))) {
            let progressRaf = false;
            function updateProgress() {
                progressRaf = false;
                const scrollable = document.documentElement.scrollHeight - window.innerHeight;
                const ratio = scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0;
                document.documentElement.style.setProperty("--ed-read-progress", ratio.toFixed(4));
            }
            window.addEventListener("scroll", () => {
                if (!progressRaf) {
                    progressRaf = true;
                    requestAnimationFrame(updateProgress);
                }
            }, { passive: true });
            updateProgress();
        }

        if (!isArticle) return;

        // 5. Highlight Active Section in Header GNB on Detail Pages
        const badgeText = (document.querySelector(".sub-visual-text-wrap .badge")?.textContent || "").trim().toUpperCase();
        const sectionKeys = ["SPECIAL", "INTERVIEW", "CRITIC", "GLOBAL", "KOFIC STORY", "BOX OFFICE", "PRODUCTION"];
        const matchedSection = sectionKeys.find((sec) => badgeText.startsWith(sec));
        if (matchedSection) {
            document.querySelectorAll(".header-depth1-link").forEach((a) => {
                if ((a.textContent || "").trim().toUpperCase() === matchedSection) {
                    a.classList.add("is-current");
                }
            });
        }

        // 6. Estimated Reading Time
        const dateEl = document.querySelector(".sub-visual-text-wrap .detail .date");
        if (dateEl && !dateEl.querySelector(".ed-read-time")) {
            let totalChars = 0;
            document.querySelectorAll(".sub-view-content .n-common-text-1, .sub-view-content .sub-summation li p").forEach((el) => {
                totalChars += (el.textContent || "").replace(/\s+/g, "").length;
            });
            const isEng = /global-eng\.html/i.test(window.location.pathname);
            const mins = Math.max(1, Math.round(totalChars / (isEng ? 900 : 500)));
            const span = document.createElement("span");
            span.className = "ed-read-time";
            span.textContent = isEng ? `${mins} min read` : `약 ${mins}분 읽기`;
            dateEl.appendChild(span);
        }

        // 7. 3-Step Font Size Control (작게 / 보통 / 크게) with localStorage
        const checkboxWrap = document.querySelector(".sub-visual-text-wrap .checkbox-wrap");
        if (checkboxWrap && !checkboxWrap.querySelector(".ed-font-controls")) {
            const saved = localStorage.getItem("kofic_font_scale") || "md";
            const controls = document.createElement("div");
            controls.className = "ed-font-controls";
            controls.setAttribute("role", "group");
            controls.setAttribute("aria-label", "본문 글자 크기 조절");

            const scales = [
                { key: "sm", label: "작게" },
                { key: "md", label: "보통" },
                { key: "lg", label: "크게" }
            ];

            function setScale(key) {
                document.documentElement.setAttribute("data-font-scale", key);
                body.classList.toggle("view-checked", key === "lg");
                try { localStorage.setItem("kofic_font_scale", key); } catch (e) {}
                controls.querySelectorAll(".ed-font-btn").forEach((btn) => {
                    const active = btn.dataset.scale === key;
                    btn.classList.toggle("is-active", active);
                    btn.setAttribute("aria-pressed", active ? "true" : "false");
                });
            }

            scales.forEach((s) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "ed-font-btn";
                btn.dataset.scale = s.key;
                btn.textContent = s.label;
                btn.addEventListener("click", () => setScale(s.key));
                controls.appendChild(btn);
            });

            checkboxWrap.innerHTML = "";
            checkboxWrap.appendChild(controls);
            setScale(scales.some((s) => s.key === saved) ? saved : "md");
        }

        // 8. Collapsible Article TOC for Long-Form Articles (>= 3 subheadings)
        const subheadings = Array.from(document.querySelectorAll(".sub-view-content .content-container-1 .n-common-title-2"))
            .filter((el) => (el.textContent || "").trim().length > 0);
        if (subheadings.length >= 3 && !document.querySelector(".ed-toc")) {
            const details = document.createElement("details");
            details.className = "ed-toc";
            const summary = document.createElement("summary");
            summary.textContent = `이 글의 목차 (${subheadings.length})`;
            details.appendChild(summary);

            const list = document.createElement("ol");
            list.className = "ed-toc-list";
            subheadings.forEach((h, idx) => {
                const id = h.id || `article-sec-${idx + 1}`;
                h.id = id;
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = "#" + id;
                const num = document.createElement("span");
                num.className = "ed-toc-num";
                num.textContent = String(idx + 1).padStart(2, "0");
                const text = document.createElement("span");
                text.textContent = (h.textContent || "").trim();
                a.appendChild(num);
                a.appendChild(text);
                li.appendChild(a);
                list.appendChild(li);
            });
            details.appendChild(list);

            const summation = document.querySelector(".sub-view-content .content-container-1 .sub-summation");
            const container = document.querySelector(".sub-view-content .content-container-1");
            if (summation && summation.parentNode) {
                summation.parentNode.insertBefore(details, summation.nextSibling);
            } else if (container) {
                container.insertBefore(details, container.firstChild);
            }
        }

        // 9. Editorial Prev / List / Next Article Navigation Bar
        const pageList = document.querySelector(".common-page-list");
        const currentFile = window.location.pathname.split("/").pop();
        const currentIdx = ISSUE_ARTICLES.findIndex((a) => a.file === currentFile);
        if (pageList && currentIdx >= 0 && !pageList.querySelector(".ed-article-nav")) {
            const prevItem = currentIdx > 0 ? ISSUE_ARTICLES[currentIdx - 1] : null;
            const nextItem = currentIdx < ISSUE_ARTICLES.length - 1 ? ISSUE_ARTICLES[currentIdx + 1] : null;
            const existingListLink = pageList.querySelector(".link-list")?.getAttribute("href") || (rootPrefix + "list.html");

            const nav = document.createElement("nav");
            nav.className = "ed-article-nav";
            nav.setAttribute("aria-label", "이전·다음 기사 이동");

            if (prevItem) {
                const prevA = document.createElement("a");
                prevA.className = "ed-nav-link is-prev";
                prevA.href = "./" + prevItem.file;
                prevA.innerHTML = `<span class="ed-nav-label">← 이전 기사 · ${prevItem.section}</span><span class="ed-nav-title">${prevItem.title}</span>`;
                nav.appendChild(prevA);
            } else {
                const spacer = document.createElement("div");
                nav.appendChild(spacer);
            }

            const listA = document.createElement("a");
            listA.className = "ed-nav-list-btn";
            listA.href = existingListLink;
            listA.textContent = "목록으로";
            nav.appendChild(listA);

            if (nextItem) {
                const nextA = document.createElement("a");
                nextA.className = "ed-nav-link is-next";
                nextA.href = "./" + nextItem.file;
                nextA.innerHTML = `<span class="ed-nav-label">${nextItem.section} · 다음 기사 →</span><span class="ed-nav-title">${nextItem.title}</span>`;
                nav.appendChild(nextA);
            } else {
                const spacer = document.createElement("div");
                nav.appendChild(spacer);
            }

            pageList.classList.add("has-ed-nav");
            pageList.insertBefore(nav, pageList.firstChild);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
