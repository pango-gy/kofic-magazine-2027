/* ==========================================================================
   웹진 <한국영화> 2027 — Interactive Editorial Engine (Zero Dependencies)
   ========================================================================== */
(function () {
    if (window.__kofic2027Init) return;
    window.__kofic2027Init = true;

    const ISSUE_ARTICLES = [
        { file: "special-2.html", section: "SPECIAL", label: "SPECIAL ②", title: "진실 기록 넘어 사회 변화로", sub: "한국형 ‘임팩트 다큐’ 생태계, 필요하다" },
        { file: "special-1.html", section: "SPECIAL", label: "SPECIAL ①", title: "새로운 영화·영상 제작 거점으로의 출발", sub: "부산기장촬영소를 가다" },
        { file: "people-2.html", section: "INTERVIEW", label: "INTERVIEW ②", title: "엉뚱하지만 파괴적인", sub: "<부활남: 더 레드> 정성호 무술감독" },
        { file: "people-1.html", section: "INTERVIEW", label: "INTERVIEW ①", title: "인간다움과 인간다운 죽음에 대하여", sub: "<구제역에서 살아 돌아온 돼지> 故 허범욱 감독" },
        { file: "reading-2.html", section: "CRITIC", label: "CRITIC ② · YES or NO", title: "낙원 없이 살아가는 법", sub: "<실낙원>" },
        { file: "reading-1.html", section: "CRITIC", label: "CRITIC ①", title: "미옥과 호석의 내일을 위한 시간", sub: "<가능한 사랑>" },
        { file: "global.html", section: "GLOBAL", label: "GLOBAL", title: "도시 전체와 호흡하는 축제로", sub: "커뮤니티비프와 동네방네비프" },
        { file: "global-eng.html", section: "GLOBAL(ENG)", label: "GLOBAL · ENG", title: "A Festival in Step with an Entire City", sub: "Community BIFF and BIFF Everywhere" },
        { file: "kofic-story.html", section: "KOFIC STORY", label: "KOFIC STORY", title: "창작자, 어떤 판 위에서 놀게 할 것인가", sub: "2026 KOFIC AI 쇼케이스" },
        { file: "boxoffice-5.html", section: "BOX OFFICE", label: "BOX OFFICE", title: "10월 5주차 위클리 박스오피스", sub: "극장판 치이카와 1위 수성" },
        { file: "boxoffice-4.html", section: "BOX OFFICE", label: "BOX OFFICE", title: "10월 4주차 위클리 박스오피스", sub: "주간 흥행 리포트" },
        { file: "boxoffice-3.html", section: "BOX OFFICE", label: "BOX OFFICE", title: "10월 3주차 위클리 박스오피스", sub: "주간 흥행 리포트" },
        { file: "boxoffice-2.html", section: "BOX OFFICE", label: "BOX OFFICE", title: "10월 2주차 위클리 박스오피스", sub: "주간 흥행 리포트" },
        { file: "boxoffice-1.html", section: "BOX OFFICE", label: "BOX OFFICE", title: "10월 1주차 위클리 박스오피스", sub: "주간 흥행 리포트" },
        { file: "production.html", section: "PRODUCTION", label: "PRODUCTION", title: "9월 개봉작 살펴보기", sub: "2026. 9. 한국영화 제작상황판" }
    ];

    function showToast(message) {
        let toast = document.querySelector(".ed-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "ed-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("is-show");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove("is-show"), 2400);
    }

    function getRootPrefix() {
        // Issue pages sit one folder down; film pages (…/production/film-NN.html) two
        const m = window.location.pathname.match(/\/\d{4}-\d{2}\/(.*)$/);
        if (!m) return "./";
        return "../".repeat(m[1].split("/").length);
    }

    // word-break: keep-all only keeps runs *between spaces* together; browsers
    // still break inside runs glued with punctuation ("<실낙원>|의",
    // "장치다.|(웃음)", "제작·|배급"). Wrap such short runs in a no-wrap span.
    // Runs longer than 18 chars are left alone so narrow screens can't overflow.
    function glueKoreanPunctuation(root) {
        if (!root) return;
        const GLUE = /[<>()\[\]「」『』‘’“”·&=]/;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const p = node.parentElement;
                if (!p || p.closest("script, style, textarea, input, code, pre, .nb")) return NodeFilter.FILTER_REJECT;
                return GLUE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach((node) => {
            const parts = node.nodeValue.split(/(\s+)/);
            if (!parts.some((t) => t && !/^\s+$/.test(t) && GLUE.test(t) && t.length > 1 && t.length <= 18)) return;
            const frag = document.createDocumentFragment();
            parts.forEach((t) => {
                if (t && !/^\s+$/.test(t) && GLUE.test(t) && t.length > 1 && t.length <= 18) {
                    const span = document.createElement("span");
                    span.className = "nb";
                    span.textContent = t;
                    frag.appendChild(span);
                } else if (t) {
                    frag.appendChild(document.createTextNode(t));
                }
            });
            node.parentNode.replaceChild(frag, node);
        });
    }

    function init() {
        glueKoreanPunctuation(document.getElementById("main-content") || document.body);
        const rootPrefix = getRootPrefix();
        const header = document.querySelector(".ed-header");
        const drawer = document.getElementById("issueDrawer");
        const topBtn = document.getElementById("edTopBtn");

        // 1. Header scroll state & Back-to-top button
        let scrollRaf = false;

        function onScroll() {
            scrollRaf = false;
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const y = Math.max(0, Math.min(window.scrollY, maxScroll));

            if (header) {
                // The header stays pinned on every screen size (it used to slide
                // away on mobile scroll-down, which left sticky bars floating).
                header.classList.toggle("is-scrolled", y > 12);
            }
            if (topBtn) {
                topBtn.classList.toggle("is-visible", y > 420);
            }

            // Fallback scroll progress bar when CSS scroll-timeline is unsupported
            if (document.querySelector(".ed-progress-bar") && !(window.CSS && CSS.supports("animation-timeline", "scroll()"))) {
                const ratio = maxScroll > 0 ? y / maxScroll : 0;
                document.documentElement.style.setProperty("--ed-read-progress", ratio.toFixed(4));
            }
        }

        window.addEventListener("scroll", () => {
            if (!scrollRaf) {
                scrollRaf = true;
                requestAnimationFrame(onScroll);
            }
        }, { passive: true });
        onScroll();

        if (topBtn) {
            topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        }

        // 2. Issue Index & Search Drawer
        function openDrawer(focusSearch) {
            if (!drawer) return;
            drawer.classList.add("is-open");
            drawer.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            if (focusSearch) {
                const input = drawer.querySelector("input");
                if (input) setTimeout(() => input.focus(), 80);
            }
        }

        function closeDrawer() {
            if (!drawer) return;
            drawer.classList.remove("is-open");
            drawer.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }

        document.querySelectorAll("[data-open-drawer]").forEach((btn) => {
            btn.addEventListener("click", () => openDrawer(btn.dataset.openDrawer === "search"));
        });
        document.querySelectorAll("[data-close-drawer]").forEach((btn) => {
            btn.addEventListener("click", closeDrawer);
        });
        if (drawer) {
            drawer.addEventListener("click", (e) => {
                if (e.target === drawer) closeDrawer();
            });
        }

        // Global search forms -> list.html?q=
        document.querySelectorAll("[data-search-form]").forEach((form) => {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const input = form.querySelector("input");
                const q = (input?.value || "").trim();
                if (!q) {
                    showToast("검색어를 입력해 주세요.");
                    input?.focus();
                    return;
                }
                window.location.href = rootPrefix + "list.html?q=" + encodeURIComponent(q);
            });
        });

        // 3. Modals (Reader Opinion & Newsletter)
        function openModal(id) {
            const modal = document.getElementById(id);
            if (!modal) return;
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }

        function closeAllModals() {
            document.querySelectorAll(".ed-modal.is-open").forEach((m) => {
                m.classList.remove("is-open");
                m.setAttribute("aria-hidden", "true");
            });
            document.body.style.overflow = "";
        }

        document.querySelectorAll("[data-open-modal]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                openModal(btn.dataset.openModal);
            });
        });
        document.querySelectorAll("[data-close-modal]").forEach((btn) => {
            btn.addEventListener("click", closeAllModals);
        });
        document.querySelectorAll(".ed-modal").forEach((m) => {
            m.addEventListener("click", (e) => {
                if (e.target === m) closeAllModals();
            });
        });
        document.querySelectorAll("[data-modal-form]").forEach((form) => {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const msg = form.dataset.modalForm === "opinion"
                    ? "소중한 독자 의견이 접수되었습니다."
                    : "웹진 <한국영화> 뉴스레터 신청이 완료되었습니다.";
                form.reset();
                closeAllModals();
                showToast(msg);
            });
        });

        // 4. MAIN PAGE: Cinema Cover Hero Switcher
        const heroStage = document.querySelector("[data-hero-stage]");
        if (heroStage) {
            const slides = Array.from(heroStage.querySelectorAll(".hero-slide-img"));
            const tabs = Array.from(heroStage.querySelectorAll(".hero-tab"));
            const eyebrow = document.getElementById("heroEyebrow");
            const title = document.getElementById("heroTitle");
            const deck = document.getElementById("heroDeck");
            const meta = document.getElementById("heroMeta");
            const cta = document.getElementById("heroCta");
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const switcher = heroStage.querySelector(".hero-switcher") || heroStage;
            const SLIDE_MS = 6000;
            let idx = 0;
            let timer = null;
            let remaining = SLIDE_MS;
            let startedAt = 0;
            let paused = false;

            function setSlide(nextIdx) {
                idx = (nextIdx + tabs.length) % tabs.length;
                const tab = tabs[idx];
                slides.forEach((img, i) => img.classList.toggle("is-active", i === idx));
                tabs.forEach((btn, i) => {
                    btn.classList.toggle("is-active", i === idx);
                    btn.setAttribute("aria-selected", i === idx ? "true" : "false");
                });
                if (eyebrow) eyebrow.textContent = tab.dataset.eyebrow || "";
                if (title) title.textContent = tab.dataset.title || "";
                if (deck) deck.textContent = tab.dataset.deck || "";
                if (meta) meta.textContent = tab.dataset.meta || "";
                if (cta) cta.setAttribute("href", tab.dataset.href || "#");
            }

            // Every slide gets the same SLIDE_MS. A pause keeps the time already
            // spent, so resuming finishes the slide instead of restarting it, and
            // the tab's progress bar (CSS) freezes with it via .is-paused.
            function schedule() {
                clearTimeout(timer);
                if (reduceMotion || paused) return;
                startedAt = performance.now();
                timer = setTimeout(() => {
                    setSlide(idx + 1);
                    remaining = SLIDE_MS;
                    schedule();
                }, remaining);
            }

            function pause() {
                if (paused) return;
                paused = true;
                clearTimeout(timer);
                remaining = Math.max(0, remaining - (performance.now() - startedAt));
                heroStage.classList.add("is-paused");
            }

            function resume() {
                if (!paused) return;
                paused = false;
                heroStage.classList.remove("is-paused");
                schedule();
            }

            tabs.forEach((btn, i) => {
                btn.addEventListener("click", () => {
                    setSlide(i);
                    remaining = SLIDE_MS;
                    schedule();
                });
            });

            // Pause only while the pointer is on the tab row (not the whole cover,
            // where the mouse tends to rest right after the page loads), while
            // keyboard focus is inside the cover, or while the browser tab is hidden.
            switcher.addEventListener("mouseenter", pause);
            switcher.addEventListener("mouseleave", resume);
            heroStage.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) pause(); });
            heroStage.addEventListener("focusout", (e) => { if (!heroStage.contains(e.relatedTarget)) resume(); });
            document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));
            setSlide(0);
            schedule();
        }

        // 5. MAIN PAGE: Box Office Top 3 Poster Switcher
        const boRanks = document.querySelectorAll(".bo-rank-item");
        const boPosterImg = document.getElementById("boPosterImg");
        if (boRanks.length && boPosterImg) {
            boRanks.forEach((item) => {
                const activate = () => {
                    boRanks.forEach((r) => r.classList.remove("is-active"));
                    item.classList.add("is-active");
                    if (item.dataset.poster) boPosterImg.src = item.dataset.poster;
                    if (item.dataset.alt) boPosterImg.alt = item.dataset.alt;
                };
                item.addEventListener("mouseenter", activate);
                item.addEventListener("focus", activate);
            });
        }

        // 6. MAIN PAGE: Production Horizontal Reel Arrows
        const prodReel = document.getElementById("prodReel");
        if (prodReel) {
            document.querySelector("[data-reel-prev]")?.addEventListener("click", () => {
                prodReel.scrollBy({ left: -540, behavior: "smooth" });
            });
            document.querySelector("[data-reel-next]")?.addEventListener("click", () => {
                prodReel.scrollBy({ left: 540, behavior: "smooth" });
            });
        }

        // 7. DETAIL PAGE: Theme, Font Size, Reading Time, TOC, Carousels, Lightbox, Reactions, Prev/Next
        const articleMain = document.querySelector(".article-main");
        if (articleMain) {
            // 7-0. Single photos: expose each image's aspect ratio (from its
            // width/height attributes) so CSS can cap portrait shots by height
            // while the box already has its final size before the file loads.
            articleMain.querySelectorAll(".common-image-slide-1 .image img, .common-image-block .image img").forEach((img) => {
                const w = Number(img.getAttribute("width"));
                const h = Number(img.getAttribute("height"));
                if (w > 0 && h > 0) img.style.setProperty("--img-ar", (w / h).toFixed(4));
            });

            // 7-1. Production film cards: the spec text is "label: value<br>..."
            // with many empty fields (크랭크인/크랭크업). Rebuild it as one
            // label/value row per line and drop the empty ones.
            articleMain.querySelectorAll(".common-list-3 .item .text").forEach((p) => {
                const lines = p.innerText.split("\n").map((l) => l.trim()).filter(Boolean);
                const rows = lines
                    .map((l) => {
                        const i = l.indexOf(":");
                        return i < 0 ? null : { k: l.slice(0, i).trim(), v: l.slice(i + 1).trim() };
                    })
                    .filter((r) => r && r.k && r.v);
                if (!rows.length) return;
                p.textContent = "";
                rows.forEach(({ k, v }) => {
                    const row = document.createElement("span");
                    row.className = "spec-row";
                    const kEl = document.createElement("span");
                    kEl.className = "spec-k";
                    kEl.textContent = k;
                    const vEl = document.createElement("span");
                    vEl.className = "spec-v";
                    vEl.textContent = v;
                    row.append(kEl, vEl);
                    p.appendChild(row);
                });
                p.classList.add("is-specs");
            });

            // 7a. Theme Switcher (paper / sepia / dark)
            const themeBtns = document.querySelectorAll("[data-set-theme]");
            function applyTheme(theme) {
                const valid = ["paper", "sepia", "dark"].includes(theme) ? theme : "paper";
                document.documentElement.setAttribute("data-theme", valid);
                try { localStorage.setItem("kofic_theme", valid); } catch (e) {}
                themeBtns.forEach((b) => {
                    const active = b.dataset.setTheme === valid;
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-pressed", active ? "true" : "false");
                });
            }
            themeBtns.forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.setTheme)));
            // The theme buttons are gone from the page; a theme saved earlier must not strand the reader in it
            applyTheme(themeBtns.length ? (localStorage.getItem("kofic_theme") || "paper") : "paper");

            // 7b. Font Scale Switcher (sm / md / lg)
            const scaleBtns = document.querySelectorAll("[data-set-scale]");
            function applyScale(scale) {
                const valid = ["sm", "md", "lg"].includes(scale) ? scale : "md";
                document.documentElement.setAttribute("data-font-scale", valid);
                try { localStorage.setItem("kofic_font_scale", valid); } catch (e) {}
                scaleBtns.forEach((b) => {
                    const active = b.dataset.setScale === valid;
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-pressed", active ? "true" : "false");
                });
            }
            scaleBtns.forEach((b) => b.addEventListener("click", () => applyScale(b.dataset.setScale)));
            applyScale(localStorage.getItem("kofic_font_scale") || "md");

            // 7c. Estimated Reading Time
            const readTimeEl = document.getElementById("articleReadTime");
            if (readTimeEl) {
                let chars = 0;
                articleMain.querySelectorAll(".n-common-text-1, .sub-summation li p").forEach((el) => {
                    chars += (el.textContent || "").replace(/\s+/g, "").length;
                });
                const isEng = /global-eng\.html/i.test(window.location.pathname);
                const mins = Math.max(1, Math.round(chars / (isEng ? 900 : 500)));
                readTimeEl.textContent = isEng ? `${mins} min read` : `약 ${mins}분 읽기`;
            }

            // 7d. Collapsible TOC for Long Articles (>= 3 subheadings)
            const subheadings = Array.from(articleMain.querySelectorAll(".n-common-title-2, .common-title-3"))
                .filter((el) => (el.textContent || "").trim().length > 0);
            if (subheadings.length >= 3 && !articleMain.querySelector(".ed-toc")) {
                const details = document.createElement("details");
                details.className = "ed-toc";
                const summary = document.createElement("summary");
                summary.textContent = `이 글의 목차 (${subheadings.length})`;
                details.appendChild(summary);
                const list = document.createElement("ol");
                list.className = "ed-toc-list";
                subheadings.forEach((h, i) => {
                    const id = h.id || `sec-${i + 1}`;
                    h.id = id;
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = "#" + id;
                    a.innerHTML = `<span class="ed-toc-num">${String(i + 1).padStart(2, "0")}</span><span></span>`;
                    a.lastElementChild.textContent = h.textContent.trim();
                    li.appendChild(a);
                    list.appendChild(li);
                });
                details.appendChild(list);
                const sum = articleMain.querySelector(".sub-summation");
                if (sum && sum.parentNode === articleMain) {
                    articleMain.insertBefore(details, sum.nextSibling);
                } else {
                    articleMain.insertBefore(details, articleMain.firstChild);
                }
            }

            // 7e. Native Scroll-Snap Carousel for Multi-Image Sliders
            articleMain.querySelectorAll(".common-image-slide-1").forEach((block) => {
                const wrap = block.querySelector(".slides-wrap");
                if (!wrap) return;
                const imgs = Array.from(wrap.children).filter((c) => c.classList.contains("image"));
                if (imgs.length <= 1) return;

                wrap.classList.add("ed-carousel-track");
                // Navigation = a strip of the other photos joined to the foot of the frame
                const nav = document.createElement("div");
                nav.className = "ed-carousel-thumbs";
                nav.setAttribute("role", "group");
                nav.setAttribute("aria-label", "사진 선택");
                const thumbs = imgs.map((slide, i) => {
                    const src = slide.querySelector("img");
                    const b = document.createElement("button");
                    b.type = "button";
                    b.className = "ed-carousel-thumb";
                    b.setAttribute("aria-label", `${i + 1}번째 사진 보기 (전체 ${imgs.length}장)`);
                    const t = document.createElement("img");
                    const small = src && (src.getAttribute("srcset") || "").split(",").map((x) => x.trim().split(" ")[0]).find((x) => /-600w\./.test(x));
                    t.src = small || (src ? src.getAttribute("src") : "");
                    t.alt = "";
                    t.loading = "lazy";
                    t.decoding = "async";
                    b.appendChild(t);
                    const show = () => wrap.scrollTo({ left: i * wrap.clientWidth, behavior: "smooth" });
                    b.addEventListener("click", show);
                    b.addEventListener("focus", show);
                    // Mouse only: hovering a thumbnail brings that photo up into the frame
                    b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(); });
                    nav.appendChild(b);
                    return b;
                });
                wrap.insertAdjacentElement("afterend", nav);

                const mark = () => {
                    const w = wrap.clientWidth || 1;
                    const cur = Math.min(imgs.length - 1, Math.max(0, Math.round(wrap.scrollLeft / w)));
                    thumbs.forEach((b, i) => {
                        b.classList.toggle("is-current", i === cur);
                        if (i === cur) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
                    });
                };
                wrap.addEventListener("scroll", mark, { passive: true });
                mark();
            });

            // 7f. Image viewer: every photo of the article in one sequence —
            // counter, previous / next (buttons, arrow keys, swipe), caption.
            const lightbox = document.getElementById("edLightbox");
            const lbImg = lightbox?.querySelector("img");
            const lbCap = lightbox?.querySelector(".ed-lightbox-caption");
            const lbItems = Array.from(document.querySelectorAll(".article-cover-frame img, .article-main .js-image-full-layer, .article-main .common-image-slide-1 img, .article-main .common-image-block-2 img, .article-main .common-image-col-2 img, .article-main .common-image-block .image img"))
                .filter((img) => !img.closest(".ed-carousel-thumb"));
            let lbIndex = 0;
            let lbCount = null, lbPrev = null, lbNext = null;

            if (lightbox && lbImg) {
                const closeBtn = lightbox.querySelector(".ed-lightbox-close");
                if (closeBtn) closeBtn.textContent = "닫기";
                lbCount = document.createElement("span");
                lbCount.className = "ed-lightbox-count";
                lbCount.setAttribute("aria-live", "polite");
                const mk = (cls, label, text, step) => {
                    const b = document.createElement("button");
                    b.type = "button";
                    b.className = "ed-lightbox-nav " + cls;
                    b.setAttribute("aria-label", label);
                    b.textContent = text;
                    b.addEventListener("click", (e) => { e.stopPropagation(); showLightbox(lbIndex + step); });
                    return b;
                };
                lbPrev = mk("is-prev", "이전 사진", "←", -1);
                lbNext = mk("is-next", "다음 사진", "→", 1);
                lightbox.append(lbCount, lbPrev, lbNext);
                let x0 = null;
                lightbox.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
                lightbox.addEventListener("touchend", (e) => {
                    if (x0 === null) return;
                    const dx = e.changedTouches[0].clientX - x0;
                    x0 = null;
                    if (Math.abs(dx) > 50) showLightbox(lbIndex + (dx < 0 ? 1 : -1));
                }, { passive: true });
            }

            function lightboxCaption(img) {
                return img.closest(".common-image-slide-1, .common-image-block-2, .common-image-col-2, .common-image-block, .article-cover")
                    ?.querySelector(".common-desc, .article-cover-caption")?.textContent.trim() || "";
            }

            function showLightbox(i) {
                if (!lightbox || !lbImg || !lbItems.length) return;
                lbIndex = Math.min(lbItems.length - 1, Math.max(0, i));
                const img = lbItems[lbIndex];
                const cap = lightboxCaption(img);
                lbImg.src = img.dataset.fullSrc || img.currentSrc || img.src;
                lbImg.alt = cap;
                if (lbCap) lbCap.textContent = cap;
                if (lbCount) lbCount.textContent = `${lbIndex + 1} / ${lbItems.length}`;
                if (lbPrev) lbPrev.disabled = lbIndex === 0;
                if (lbNext) lbNext.disabled = lbIndex === lbItems.length - 1;
                lightbox.classList.toggle("is-single", lbItems.length < 2);
            }

            function openLightbox(i) {
                if (!lightbox || !lbImg) return;
                showLightbox(i);
                lightbox.classList.add("is-open");
                lightbox.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
            }

            function closeLightbox() {
                if (!lightbox) return;
                lightbox.classList.remove("is-open");
                lightbox.setAttribute("aria-hidden", "true");
                document.body.style.overflow = "";
            }

            lbItems.forEach((img, i) => img.addEventListener("click", () => openLightbox(i)));

            lightbox?.querySelector(".ed-lightbox-close")?.addEventListener("click", closeLightbox);
            lightbox?.addEventListener("click", (e) => {
                if (e.target === lightbox) closeLightbox();
            });
            document.addEventListener("keydown", (e) => {
                if (!lightbox?.classList.contains("is-open")) return;
                if (e.key === "ArrowLeft") showLightbox(lbIndex - 1);
                if (e.key === "ArrowRight") showLightbox(lbIndex + 1);
            });

            // 7g. Tag Click -> Filtered List Page
            articleMain.querySelectorAll(".common-tag-list span").forEach((tag) => {
                tag.setAttribute("tabindex", "0");
                tag.setAttribute("role", "link");
                const go = () => {
                    const kw = tag.textContent.trim().replace(/^#/, "");
                    window.location.href = rootPrefix + "list.html?q=" + encodeURIComponent(kw);
                };
                tag.addEventListener("click", go);
                tag.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
                });
            });

            // 7h. Reaction Buttons & Share/Copy
            articleMain.querySelectorAll(".sub-sns .emotion button").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const b = btn.querySelector("b");
                    const voted = btn.classList.toggle("is-voted");
                    if (b) b.textContent = String(Math.max(0, Number(b.textContent || 0) + (voted ? 1 : -1)));
                    showToast(voted ? "공감을 남겼습니다." : "공감을 취소했습니다.");
                });
            });

            function copyPageLink() {
                const url = window.location.href;
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(url).then(() => showToast("기사 링크가 클립보드에 복사되었습니다."));
                } else {
                    showToast("링크 복사를 지원하지 않는 환경입니다.");
                }
            }

            document.querySelectorAll("[data-copy-link], .sub-sns .btn-copy, .sub-sns .btn-share").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    // "Share" opens the system share sheet where there is one; otherwise it copies, like the copy button
                    if (btn.classList.contains("btn-share") && navigator.share) {
                        navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
                        return;
                    }
                    copyPageLink();
                });
            });

            // 7i. Prev / List / Next Article Navigation
            const navContainer = document.getElementById("articleNavBar");
            const currentFile = window.location.pathname.split("/").pop();
            const curIndex = ISSUE_ARTICLES.findIndex((a) => a.file === currentFile);
            if (navContainer && curIndex >= 0) {
                const prev = curIndex > 0 ? ISSUE_ARTICLES[curIndex - 1] : null;
                const next = curIndex < ISSUE_ARTICLES.length - 1 ? ISSUE_ARTICLES[curIndex + 1] : null;
                const sec = ISSUE_ARTICLES[curIndex].section;
                navContainer.innerHTML = `
                    ${prev ? `<a class="article-nav-card is-prev" href="./${prev.file}"><span class="article-nav-dir">← 이전 기사 · ${prev.label}</span><span class="article-nav-name">${prev.title}</span></a>` : `<div></div>`}
                    <a class="article-nav-list" href="../list.html?section=${encodeURIComponent(sec)}">목록으로</a>
                    ${next ? `<a class="article-nav-card is-next" href="./${next.file}"><span class="article-nav-dir">${next.label} · 다음 기사 →</span><span class="article-nav-name">${next.title}</span></a>` : `<div></div>`}
                `;
            }

            // Close lightbox on Escape
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") closeLightbox();
            });
        }

        // Global Escape closes drawer & modals
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeDrawer();
                closeAllModals();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
