/* GLOBAL 영문번역 팝업 — 파일 최상단 */


$(function() {
    $('.section-key-visual .slide-container').slick({
        arrows: false,
        dots: true,
        fade: true,
        autoplay: true,
        speed: 500,
        autoplaySpeed: 5000
    });

    $('.m-list-slick-1').slick({
        arrows: true,
        dots: true,
        speed: 500,
        mobileFirst: true,
        responsive: [
            {
                breakpoint: 781,
                settings: 'unslick'
            }
        ]
    });

    setTimeout(function() {
        $('.m-list-slick-1 .slick-dots').css(
            'top',
            $('.m-list-slick-1 .slick-slide:eq(0) .item img').height() + 10
        );

        $(window).on('resize', function() {
            setTimeout(function() {
                $('.m-list-slick-1 .slick-dots').css('top', '');
                $('.m-list-slick-1 .slick-dots').css(
                    'top',
                    $('.m-list-slick-1 .slick-slide:eq(0) .item img').height() + 10
                );
            }, 100);
        });
    }, 300);

    $('.js-open-column').on('click', function(e) {
        e.preventDefault();
        $('body').css('overflow', 'hidden');
        $('.column-list').fadeIn();
    });

    $('.column-list .dim, .column-list .close').on('click', function() {
        $('.column-list').fadeOut();
        $('body').removeAttr('style');
    });

    $(window).on('load scroll', function() {
        if ($(window).scrollTop() > 0) {
            $('header').addClass('is-scroll');
        } else {
            $('header').removeClass('is-scroll');
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const banners = document.querySelectorAll('.banner');
    const totalBanners = banners.length;
    const bannerWrapper = document.getElementById('bannerWrapper');
    let currentIndex = 0;

    /* 배너가 없는 상세페이지에서는 실행하지 않음 */
    if (!bannerWrapper || totalBanners === 0) {
        return;
    }

    function showBanner(index) {
        bannerWrapper.style.transform =
            `translateX(-${index * 100}%)`;
    }

    setInterval(function() {
        currentIndex = (currentIndex + 1) % totalBanners;
        showBanner(currentIndex);
    }, 3000);
});
/* ==================================================
   GLOBAL 영문번역 자체 팝업
   simpleModal 플러그인 사용 안 함
================================================== */
$(function() {

    /*
     * 기존 파일에 등록된 영문 팝업 클릭 이벤트 제거
     */
    $('[data-js-open-modal]').off('click');
    $(document).off('click', '[data-js-open-modal]');

    /*
     * 영문 팝업 열기
     */
    $(document).on(
        'click.koficEnglish',
        '[data-js-open-modal]',
        function(e) {
            e.preventDefault();
            e.stopPropagation();

            var htmlTarget =
                $(this).attr('data-js-open-modal');

            var title =
                $(this).attr('data-title') || '';

            var $source = $(htmlTarget);

            if (!$source.length) {
                console.error(
                    '영문번역 내용을 찾을 수 없습니다:',
                    htmlTarget
                );
                return;
            }

            /*
             * 기존 simpleModal이 남긴 요소와 body 스타일 정리
             */
            $('.simple-modal').remove();

            $('body').css({
                position: '',
                top: '',
                width: ''
            });

            /*
             * 팝업이 없으면 한 번만 생성
             */
            if (!$('#koficEnglishPopup').length) {
                $('body').append(
                    '<div id="koficEnglishPopup" ' +
                        'class="kofic-english-popup" ' +
                        'aria-hidden="true">' +

                        '<button type="button" ' +
                            'class="kofic-english-popup__backdrop" ' +
                            'aria-label="팝업 닫기"></button>' +

                        '<div class="kofic-english-popup__scroll">' +
                            '<div class="kofic-english-popup__dialog">' +

                                '<div class="kofic-english-popup__header">' +
                                    '<p class="kofic-english-popup__title"></p>' +

                                    '<button type="button" ' +
                                        'class="kofic-english-popup__close" ' +
                                        'aria-label="팝업 닫기">' +
                                        '<span></span>' +
                                    '</button>' +
                                '</div>' +

                                '<div class="kofic-english-popup__content"></div>' +

                            '</div>' +
                        '</div>' +

                    '</div>'
                );
            }

            var $popup = $('#koficEnglishPopup');

            $popup
                .find('.kofic-english-popup__title')
                .text(title);

            if (title) {
                $popup
                    .find('.kofic-english-popup__title')
                    .show();
            } else {
                $popup
                    .find('.kofic-english-popup__title')
                    .hide();
            }

            $popup
                .find('.kofic-english-popup__content')
                .html($source.html());

            $('html, body').addClass('kofic-modal-open');

            $popup
                .addClass('is-open')
                .attr('aria-hidden', 'false');

            $popup
                .find('.kofic-english-popup__scroll')
                .scrollTop(0);
        }
    );

    /*
     * 팝업 닫기
     */
    function closeEnglishPopup() {
        $('#koficEnglishPopup')
            .removeClass('is-open')
            .attr('aria-hidden', 'true');

        $('html, body').removeClass('kofic-modal-open');
    }

    $(document).on(
        'click.koficEnglishClose',
        '.kofic-english-popup__close, ' +
        '.kofic-english-popup__backdrop',
        function(e) {
            e.preventDefault();
            closeEnglishPopup();
        }
    );

    /*
     * ESC 키로 닫기
     */
    $(document).on(
        'keydown.koficEnglish',
        function(e) {
            if (e.key === 'Escape') {
                closeEnglishPopup();
            }
        }
    );
});