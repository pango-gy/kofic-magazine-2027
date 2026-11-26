# kofic-magazine-2027
웹진 입찰 디자인 시연 사이트

## 구조

기사 정보는 `data/` 한 곳에만 적는다. 목록, 서랍 목차, 이전·다음 기사, 메인의 News, 검색은 여기서 만들어진다.

| 위치 | 내용 |
| --- | --- |
| `data/site.json` | 현재 호(`current`), 호 목록(`issues`, 최신이 맨 앞), 섹션 |
| `data/<호>.json` | 그 호의 이름과 기사 목록(읽는 순서대로) |
| `<호>/index.html` | 그 호의 메인 페이지 (직접 작성) |
| `<호>/*.html` | 기사 페이지 (직접 작성) |
| `index.html` | 현재 호 메인의 사본. **직접 고치지 않는다** |
| `list.html`의 카드, 각 페이지의 서랍 목차 | 표식 주석(`cards`, `drawer`, `news`) 사이는 자동 생성. 직접 고치지 않는다 |

고친 뒤에는 항상 아래를 실행한다. CSS·JS 주소 뒤의 `?v=`도 이때 함께 바뀐다.

```bash
python3 scripts/build_site.py
```

### 기사 추가 (뉴스 포함)

1. `<호>/` 안에 기사 페이지를 만든다. 같은 종류의 기존 기사를 복사해 내용을 바꾸면 된다.
2. `data/<호>.json`의 `articles`에 한 항목을 추가한다. 넣는 위치가 곧 읽는 순서다.
   - 꼭 필요한 값: `file`, `section`, `label`, `date`, `title`, `image`
   - 있으면 좋은 값: `deck`(목록 요약), `sub`(목차 보조 문구), `by`(예: `글 · 홍길동`), `kind`, `corner`(예: `WEEKLY REVIEW`), `shortTitle`, `search`(검색어)
3. 생성 스크립트를 실행한다.

뉴스는 `section`이 `NEWS`인 기사다. 날짜가 최신인 4건이 메인 News에 자동으로 나온다.

### 새 호 발행

1. `<새 호>/` 폴더를 만들고 메인(`index.html`)과 기사 페이지를 넣는다. 지난 호 메인을 복사해 시작하면 된다.
2. `data/<새 호>.json`을 만든다 (`id`, `label`, `title`, `published`, `articles`).
3. `data/site.json`에서 `issues` 맨 앞에 새 호를 넣고 `current`를 새 호로 바꾼다.
4. 생성 스크립트를 실행한다.

지난 호는 `<호>/index.html`과 `list.html?issue=<호>`로 계속 볼 수 있고, 호가 둘 이상이면 목록 페이지에 호 선택이 나타난다.

### 공유 미리보기 (카카오톡·슬랙 등)

모든 페이지에 `og:`/`twitter:` 태그가 들어간다(`<!-- og:start -->` ~ `<!-- og:end -->`, 자동 생성). 이미지는 1200×630 JPG로 `assets/images/og/`에 둔다.

```bash
python3 scripts/build_og.py
```

기사나 호를 추가한 뒤 위 명령으로 빠진 이미지를 만들고, 이어서 `build_site.py`를 실행한다. 호 카드는 Chrome으로 그리므로 Chrome과 Pillow가 필요하다. 사이트 주소는 `data/site.json`의 `url`이다.
