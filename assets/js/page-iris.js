/*
 * 페이지 이동 아이리스 전환(refine.css 15번)에 클릭 지점을 넘겨준다.
 * 이전 페이지: 클릭 좌표를 sessionStorage에 기록
 * 새 페이지: pagereveal 시점에 좌표를 --rf-iris-x / --rf-iris-y로 지정
 * 전환 애니메이션은 새 페이지의 CSS로 그려지므로 새 페이지에서 변수를 설정해야 한다.
 * 첫 렌더 전에 pagereveal 리스너가 있어야 해서 defer 없이 <head>에서 불러온다.
 */
(function () {
    var KEY = "rf-iris";
    var MAX_AGE = 3000;

    // 링크뿐 아니라 JS로 이동하는 영역(메인 비주얼 등)도 있어 모든 클릭을 기록한다
    document.addEventListener(
        "click",
        function (e) {
            try {
                sessionStorage.setItem(
                    KEY,
                    JSON.stringify({ x: e.clientX, y: e.clientY, t: Date.now() })
                );
            } catch (err) {
                // 저장소를 쓸 수 없으면 화면 중앙에서 전환된다
            }
        },
        true
    );

    window.addEventListener("pagereveal", function () {
        var root = document.documentElement;
        try {
            var saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
            sessionStorage.removeItem(KEY);
            var x = window.innerWidth / 2;
            var y = window.innerHeight / 2;
            if (saved && Date.now() - saved.t < MAX_AGE) {
                x = saved.x;
                y = saved.y;
            }
            // 원이 화면을 막 덮는 크기(가장 먼 모서리까지 거리)를 써야 애니메이션 전 구간이
            // 화면 안에서 보인다. 지나치게 크면 대부분 화면 밖에서 줄어들어 깜빡이듯 보인다.
            var r = Math.ceil(
                Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
            );
            root.style.setProperty("--rf-iris-x", x + "px");
            root.style.setProperty("--rf-iris-y", y + "px");
            root.style.setProperty("--rf-iris-r", r + "px");
        } catch (err) {
            // 좌표가 없으면 CSS 기본값(화면 중앙)을 쓴다
        }
    });
})();
