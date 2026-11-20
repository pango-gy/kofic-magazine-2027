function blockWhileDragging(isDragging) {
    const slides = document.getElementsByClassName("slick-slide");
    for (let i = 0; i < slides.length; i++) {
        if (isDragging) {
            slides[i].classList.add("is-dragging");
        } else {
            slides[i].classList.remove("is-dragging");
        }
    }
}

let isMouseDown = false;
document.addEventListener("mousedown", () => {
    isMouseDown = true;
});
document.addEventListener("mousemove", () => {
    if (!isMouseDown) return;
    blockWhileDragging(true);
});
document.addEventListener("mouseup", () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    blockWhileDragging(false);
});

function backToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function pop(id) {
    $("#" + id).fadeIn(200);
}

function popClose(id) {
    $("#" + id).fadeOut(200);
}

$(function () {
    const ROOT = (document.querySelector(".header-logo")?.getAttribute("href") || "./index.html").replace(/index\.html$/, "");

    if ($.fn.niceSelect) {
        $(".custom-select").niceSelect();
    }

    // Full menu open / close
    $(".btn-full-menu").on("click", function (e) {
        e.preventDefault();
        $(".header-depth1").removeClass("is-active");
        $(".full-menu").show();
        $("body").css("overflow", "hidden");
    });

    $(".btn-full-menu-close").on("click", function (e) {
        e.preventDefault();
        $(".full-menu").hide();
        $("body").css("overflow", "");
    });

    $(".btn-folder").on("click", function (e) {
        e.preventDefault();
        window.location.href = ROOT + "list.html";
    });

    // Desktop GNB hover dropdown
    $(".header-depth1").on("mouseenter", function () {
        $(".header-depth1").removeClass("is-active");
        $(this).addClass("is-active");
    });

    $(".header .header-depth2, .header .inner").on("mouseleave", function () {
        $(".header-depth1").removeClass("is-active");
    });

    // Search input sync & navigation to list page
    $(".stxt").on("input", function () {
        $(".stxt").val($(this).val());
    });

    function runSearch($input) {
        const query = $.trim($input.val());
        if (query.length < 2) {
            alert("검색어를 2글자 이상 입력하셔야 합니다.");
            return;
        }
        window.location.href = ROOT + "list.html?q=" + encodeURIComponent(query);
    }

    $(".stxt").on("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            runSearch($(this));
        }
    });

    $(".sch").on("click", function (e) {
        e.preventDefault();
        const $boxInput = $(this).closest(".search-box").find(".stxt");
        runSearch($boxInput);
    });

    // Production marquee slider
    if ($(".main-section-2-right-slider").length) {
        $(".main-section-2-right-slider").slick({
            autoplay: true,
            autoplaySpeed: 0,
            speed: 5000,
            slidesToShow: 1,
            slidesToScroll: 1,
            variableWidth: true,
            centerMode: false,
            arrows: false,
            dots: false,
            infinite: true,
            cssEase: "linear",
            responsive: [
                {
                    breakpoint: 781,
                    settings: {
                        centerMode: true,
                        centerPadding: "80px",
                        arrows: false,
                        dots: false
                    }
                }
            ]
        });
    }

    // Mobile section-1 card sliders (< 781px)
    const settings1 = {
        slidesToShow: 1,
        slidesToScroll: 1,
        mobileFirst: true,
        arrows: true,
        infinite: true,
        swipeToSlide: true,
        edgeFriction: 0,
        responsive: [
            {
                breakpoint: 781,
                settings: "unslick"
            }
        ]
    };

    function initMainSectionSlider() {
        if ($(window).width() < 781) {
            $(".main-section-1").each(function () {
                const $slider = $(this);
                if (!$slider.hasClass("slick-initialized")) {
                    $slider.slick(settings1);
                }
            });
        }
    }

    initMainSectionSlider();

    let resizeTimer = null;
    $(window).on("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initMainSectionSlider, 150);
    });

    // PC Main Hero Slider
    const $pcMainVisual = $(".main-visual-list");
    if ($pcMainVisual.length && !$pcMainVisual.hasClass("slick-initialized")) {
        // 장면 전환: 레터박스 셔터(refine.css .rf-cut)
        const $heroStage = $(".main-visual");
        $heroStage.append('<div class="rf-cut" aria-hidden="true"><span></span><span></span></div>');

        $pcMainVisual
            .on("beforeChange", function (event, slick, currentSlide, nextSlide) {
                if (currentSlide !== nextSlide) {
                    $heroStage.removeClass("is-cut-open").addClass("is-cut-close");
                }
            })
            .on("init afterChange", function () {
                const $current = $(this).find(".slick-current");
                $(".main-visual .view-text .common-badge").html($current.find(".badge").html());
                $(".main-visual .view-text .text-1").html($current.find(".text-1").html());
                $(".main-visual .view-text .text-2").html($current.find(".text-2").html());
                $(".main-visual").css(
                    "background-image",
                    "url(" + $current.find(".text-wrap").data("src") + ")"
                );
                $(".main-visual").attr("vo", $current.find("a").attr("href"));

                // 샷 전환 연출(refine.css): 클래스를 뗐다 붙여 CSS 애니메이션을 처음부터 재생
                const $shot = $(".main-visual");
                const $title = $(".main-visual .view-text");
                $shot.removeClass("is-shot");
                $title.removeClass("is-title-in");
                void $shot[0].offsetWidth;
                $shot.addClass("is-shot");
                $title.addClass("is-title-in");
                if ($shot.hasClass("is-cut-close")) {
                    $shot.removeClass("is-cut-close").addClass("is-cut-open");
                }
            })
            .slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                arrows: true,
                dots: true,
                appendDots: $(".main-visual-pagination"),
                customPaging: function (slider, i) {
                    return "<button type=\"button\">" + (i < 9 ? "0" + (i + 1) : i + 1) + "</button>";
                },
                vertical: true,
                autoplay: true,
                autoplaySpeed: 5000,
                speed: 500,
                infinite: true,
                pauseOnHover: false,
                pauseOnFocus: false,
                pauseOnDotsHover: false
            });
    }

    // Mobile Main Hero Slider
    const $mobileMainVisual = $(".m-main-visual-list");
    if ($mobileMainVisual.length && !$mobileMainVisual.hasClass("slick-initialized")) {
        $mobileMainVisual.slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            fade: true,
            dots: true,
            appendDots: $(".m-main-visual-pagination"),
            customPaging: function (slider, i) {
                return "<button type=\"button\">" + (i < 9 ? "0" + (i + 1) : i + 1) + "</button>";
            },
            infinite: true,
            autoplay: true,
            autoplaySpeed: 3000,
            speed: 500,
            pauseOnHover: false,
            pauseOnFocus: false,
            pauseOnDotsHover: false
        });
    }

    // Detail Page Image Slider (only initialize Slick when 2+ images exist)
    $(".common-image-slide-1 .slides-wrap").each(function () {
        if ($(this).children(".image").length > 1) {
            $(this).slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: true,
                dots: false
            });
        }
    });

    // PC Main Visual click navigation
    $pcMainVisual.on("click", ".text-wrap", function (e) {
        e.preventDefault();
        const href = $(this).attr("href");
        if (href && href !== "#") {
            window.location.href = href;
        }
    });

    $(".main-visual .view-text")
        .css("cursor", "pointer")
        .on("click", function (e) {
            e.preventDefault();
            const href = $pcMainVisual.find(".slick-current .text-wrap").attr("href") || "./detail.html";
            window.location.href = href;
        });

    $(".main-visual")
        .css("cursor", "pointer")
        .on("click", function (e) {
            if ($(e.target).closest(".main-visual-list, .main-visual-pagination, .view-text").length) {
                return;
            }
            const href = $pcMainVisual.find(".slick-current .text-wrap").attr("href") || "./detail.html";
            window.location.href = href;
        });

    // Box Office Top 3: hover/focus switches poster preview, click navigates to detail.html
    $(".main-section-2 .left .detail .list a").on("mouseenter focus", function () {
        const targetUrl = $(this).data("src");
        const targetSrcset = $(this).data("srcset");
        const targetAlt = $(this).data("alt") || "";
        $(".main-section-2 .left .detail .list a").removeClass("is-active");
        $(this).addClass("is-active");
        const $img = $(".main-section-2 .left .detail .image img");
        $img.attr("src", targetUrl);
        if (targetSrcset) {
            $img.attr("srcset", targetSrcset);
        }
        if (targetAlt) {
            $img.attr("alt", targetAlt);
        }
    });

    // Full-menu accordion on mobile (<= 780px), direct navigation on desktop
    $(".full-menu-depth1-link").on("click", function (e) {
        if ($(window).width() <= 780 && $(this).next(".full-menu-depth2").length) {
            e.preventDefault();
            $(this).toggleClass("is-active");
        }
    });

    // Detail page floating quick visibility (rAF-throttled, no jarring mobile emotion rotation)
    let quickVisible = null;
    let quickRaf = false;
    function syncDetailResponsiveUI() {
        if (quickRaf) return;
        quickRaf = true;
        requestAnimationFrame(() => {
            quickRaf = false;
            const shouldShow = window.scrollY > 120;
            if (shouldShow !== quickVisible) {
                quickVisible = shouldShow;
                $(".sub-quick").toggleClass("is-visible", shouldShow);
                if (shouldShow) {
                    $(".sub-quick").stop(true, true).fadeIn(140);
                } else {
                    $(".sub-quick").stop(true, true).fadeOut(140);
                }
            }
        });
    }

    $(window).on("load resize scroll", syncDetailResponsiveUI);

    // Detail page controls
    $(".btn-page-back").on("click", function (e) {
        e.preventDefault();
        if (document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
            window.history.back();
        } else {
            window.location.href = ROOT + "list.html";
        }
    });

    $(".btn-page-top, .btn-quick-up").on("click", function (e) {
        e.preventDefault();
        backToTop();
    });

    $(".btn-quick-down").on("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });

    $("#viewCheck").on("change", function () {
        $("body").toggleClass("view-checked", $(this).prop("checked"));
    });

    // Emotion counters (local interactive increment for prototype demo)
    $(document).on("click", ".sub-sns .emotion button", function (e) {
        e.preventDefault();
        const $cnt = $(this).find("b");
        $cnt.text(Number($cnt.text() || 0) + 1);
    });

    // Share & URL Copy buttons
    $(document).on("click", ".sub-sns .btn-share", function (e) {
        e.preventDefault();
        $("#bottomSharePopup").toggle();
    });

    $(document).on("click", ".btn-page-share", function (e) {
        e.preventDefault();
        $("#detailSharePopup").toggle();
    });

    $(document).on("click", ".sub-sns .btn-copy", function (e) {
        e.preventDefault();
        const url = window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                alert("클립보드에 복사되었습니다.");
            });
        }
    });

    $(document).on("click", ".js-share-sns", function (e) {
        e.preventDefault();
        const platform = $(this).data("platform");
        if (typeof cosmosfarm_share === "function" && platform !== "kakaotalk") {
            cosmosfarm_share(platform, window.location.href, document.title);
        } else {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(window.location.href);
            }
            alert("공유 링크가 복사되었습니다.");
        }
    });

    // Tag clicks navigate to filtered list page
    $(document).on("click", ".common-tag-list span, .common-tags-2 span", function () {
        const tag = $.trim($(this).text()).replace(/^#/, "");
        window.location.href = ROOT + "list.html?q=" + encodeURIComponent(tag);
    });

    // Image full-screen zoom modal
    $(".js-image-full-layer").on("click", function () {
        const fullSrc = $(this).attr("data-full-src") || $(this).attr("src");
        const altText = $(this).attr("alt") || "";
        $(".image-view-layer .target-image").attr({ src: fullSrc, alt: altText });
        $(".image-view-layer").addClass("is-open");
    });

    $(".image-view-layer").on("click", function (e) {
        if ($(e.target).is(".image-view-layer") || $(e.target).closest(".btn-close").length) {
            $(".image-view-layer").removeClass("is-open");
            $(".image-view-layer .target-image").attr("src", "");
        }
    });

    // Reader opinion & newsletter modals
    $(document).on("click", "[data-open-modal]", function (e) {
        e.preventDefault();
        pop($(this).data("open-modal"));
    });

    $(document).on("click", "[data-close-modal]", function (e) {
        e.preventDefault();
        popClose($(this).data("close-modal"));
    });

    $(".senSave").on("click", function (e) {
        e.preventDefault();
        const gbn = $(this).attr("vo");
        if (gbn === "M1") {
            if (!$.trim($("#opinion1").val())) {
                alert("의견 내용을 입력해 주세요.");
                return;
            }
            alert("소중한 의견이 접수되었습니다.");
            $("#opinion1").val("");
            popClose("reader");
        } else {
            alert("처리되었습니다.");
            popClose(gbn === "M2" ? "news" : "delnews");
        }
    });

    // Escape key closes overlays
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
            if ($(".full-menu").is(":visible")) {
                $(".full-menu").hide();
                $("body").css("overflow", "");
            }
            if ($(".image-view-layer").hasClass("is-open")) {
                $(".image-view-layer").removeClass("is-open");
                $(".image-view-layer .target-image").attr("src", "");
            }
            $(".modal-wrap:visible").fadeOut(200);
        }
    });

    // Mobile Quick Menu drawer toggle
    $(".js-m-quick-open").on("click", function () {
        $(".quick-menu").toggleClass("active");
    });

    $(".quick-menu .menu a").on("click", function () {
        $(".quick-menu").removeClass("active");
    });
});

window.addEventListener("DOMContentLoaded", () => {
    if (
        document.querySelector(".sub-view-content") &&
        typeof gsap !== "undefined" &&
        typeof ScrollTrigger !== "undefined" &&
        typeof Lenis !== "undefined"
    ) {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase);

        const lenis = new Lenis({
            smooth: true,
            lerp: 0.1,
            infinite: false
        });

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        ScrollTrigger.scrollerProxy(document.body, {
            scrollTop(value) {
                return arguments.length ? lenis.scrollTo(value, { immediate: true }) : lenis.scroll;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: document.body.style.transform ? "transform" : "fixed"
        });

        lenis.on("scroll", ScrollTrigger.update);

        if (typeof CustomEase !== "undefined") {
            CustomEase.create("ease02_snapOut", "M0,0 C0.45,0 0.25,1.5 1,1");
        }

        ScrollTrigger.matchMedia({
            "(min-width: 1201px)": function () {
                gsap.to(".sub-view-content .bg", {
                    scrollTrigger: {
                        trigger: ".sub-view-content",
                        start: () => `top-=${window.innerHeight} top`,
                        end: () => `+=${window.innerHeight / 3}`,
                        scrub: 0.1,
                        pin: ".sub-view-content .bg",
                        pinSpacing: false,
                        invalidateOnRefresh: true
                    }
                });
            },
            "(max-width: 1200px)": function () {
                gsap.to(".sub-view-content .bg", {
                    scrollTrigger: {
                        trigger: ".sub-view-content",
                        start: () => "top-=574 top",
                        end: () => "+=154",
                        scrub: 0.1,
                        pin: ".sub-view-content .bg",
                        pinSpacing: false,
                        invalidateOnRefresh: true
                    }
                });
            }
        });

        window.addEventListener("resize", ScrollTrigger.update);
    }
});

// 상세 페이지 스크롤 연출(refine.css .rf-reveal)
// - 이미지: 로딩 중엔 시머 프레임, 화면에 들어오고 이미지가 준비되면 레터박스처럼 열림
// - 텍스트: 스크롤 연동 블러를 지원하는 브라우저는 CSS만으로 처리, 아니면 등장 시 한 번 페이드
window.addEventListener("DOMContentLoaded", () => {
    if (
        !document.querySelector(".sub-view-content") ||
        !("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return;
    }

    const frames = document.querySelectorAll(
        ".sub-view-content .common-image-slide-1, .sub-view-content .common-image-block-2 .image"
    );
    frames.forEach((el) => el.classList.add("rf-reveal", "rf-reveal--frame"));

    const scrollBlurSupported = window.CSS && CSS.supports("animation-timeline: view()");
    if (!scrollBlurSupported) {
        document
            .querySelectorAll(
                ".sub-view-content .n-common-title-2, .sub-view-content .sub-summation, .sub-view-content .n-common-text-1.question"
            )
            .forEach((el) => el.classList.add("rf-reveal", "rf-reveal--text"));
    }

    // 보이는 이미지 한 장(슬라이더는 현재 슬라이드)만 기다린다. 슬라이더의 숨은·복제 슬라이드는
    // loading="lazy"라 화면에 나오기 전엔 받지 않으므로 기다리면 영원히 열리지 않는다.
    // 느린 네트워크에서도 0.6초 뒤에는 연다.
    const whenImageReady = (el) => {
        const img = el.querySelector(".slick-current img") || el.querySelector("img");
        const loaded =
            !img || (img.complete && img.naturalWidth)
                ? Promise.resolve()
                : new Promise((resolve) => {
                      img.addEventListener("load", resolve, { once: true });
                      img.addEventListener("error", resolve, { once: true });
                  });
        return Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 600))]);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                observer.unobserve(el);
                if (el.classList.contains("rf-reveal--frame")) {
                    el.classList.add("is-loading");
                    whenImageReady(el).then(() => {
                        el.classList.remove("is-loading");
                        el.classList.add("is-in");
                    });
                } else {
                    el.classList.add("is-in");
                }
            });
        },
        // 화면 하단에 닿기 조금 전부터 준비해, 보이기 시작할 때 바로 열리게 한다
        { rootMargin: "0px 0px 10% 0px" }
    );
    document.querySelectorAll(".rf-reveal").forEach((el) => observer.observe(el));
});
