# SETSIGN 세트사인

말 대신, 꽂아. — 물병에 끼우고, 카드만 바꿔 꽂으면 끝.

헬스장에서 "같이 쓰실래요?"를 말하기 어려운 사람을 위한 물병 카드 밴드 홈페이지예요.

## 결제 방식

**계좌이체만 받아요.** 주문하면 서버에 설정된 계좌와 입금액, 입금 기한(3일)이 안내되고, 판매자가 통장에서 입금을 확인하면 주문이 확정돼요. 기한 안에 입금되지 않은 주문은 자동으로 "기한 지남"이 돼요.

판매자는 **`/admin.html`** (주문 관리 페이지)에서 입금 대기 주문을 보고 "입금 확인" 또는 "주문 취소"를 눌러요. 비밀번호는 서버의 `ADMIN_TOKEN` 값이에요.

## 두 가지 모드

| | 파일만 열기 · GitHub Pages | `server.mjs` 실행 |
|---|---|---|
| 디자인, 3D 쉐이커, 내향인 테스트 | ✅ | ✅ |
| 사이즈 직접 계산 | ✅ | ✅ |
| 주문 · 계좌 안내 | 데모(자리표시 계좌, 이 브라우저에만 저장) | ✅ 실제 계좌 안내 |
| 구글 로그인, 주문 관리(입금 확인), 쉐이커 사이즈 검색 | ❌ (데모 계정) | ✅ |

## 서버 실행 (Node.js 18 이상)

```bash
BANK_NAME=○○은행 BANK_ACCOUNT=000-0000-0000 BANK_HOLDER=예금주 ADMIN_TOKEN=관리자-비밀번호 node server.mjs
```

터미널에 표시되는 주소(기본 http://localhost:8080)를 브라우저로 여세요. 8080이 사용 중이면 다음 번호로 자동으로 옮겨요.

| 환경 변수 | 용도 |
|---|---|
| `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` | 주문 대금을 받을 계좌 (필수, 사업자 계좌 권장) |
| `ADMIN_TOKEN` | 주문 관리 페이지 비밀번호 (필수, 길고 추측하기 어렵게) |
| `GOOGLE_CLIENT_ID` | 구글 로그인용 OAuth 클라이언트 ID (공개 값, 필수). 회원가입·로그인은 구글 로그인만 받아요 |
| `ANTHROPIC_API_KEY` | 쉐이커 제품명으로 지름 검색 (선택) |
| `PORT`, `SHIPPING_FEE`, `DB_FILE` | 포트, 배송비, 데이터 파일 위치 |

> 계좌번호·비밀번호는 환경 변수로만 넣고, 이 저장소에는 커밋하지 마세요. 회원·주문 데이터(`data.json`)는 `.gitignore`에 들어 있어요.

## 구글 로그인 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 만들어요.
2. **Google Auth Platform**(OAuth 동의 화면)에서 앱 이름 `SETSIGN`, 대상 **외부(External)**로 설정해요.
3. **클라이언트 → 클라이언트 만들기**에서 유형 **웹 애플리케이션**을 고르고, **승인된 JavaScript 원본**에 사이트 주소(예: `https://setsign.onrender.com`, 로컬 테스트면 `http://localhost:8080`)를 넣어요.
4. 만들어진 **클라이언트 ID**(`…apps.googleusercontent.com`)를 서버 환경 변수 `GOOGLE_CLIENT_ID`에 넣어요. 클라이언트 보안 비밀(secret)은 쓰지 않아요.

서버는 구글이 준 로그인 토큰(ID 토큰)을 구글 공개 키로 검증하고, 이메일이 확인된 계정만 받아요. 비밀번호는 저장하지 않아요.

## 인터넷 주소로 주문 테스트하기 (Render)

1. [render.com](https://render.com)에 GitHub 계정으로 가입해요.
2. 대시보드에서 **New → Blueprint**를 누르고 이 저장소(`my-homepage`)를 골라요. `render.yaml`대로 서비스가 만들어져요.
3. `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` 칸을 채우고 **Deploy**를 눌러요. `ADMIN_TOKEN`은 Render가 만들어 줘요.
4. 배포가 끝나면 생기는 `https://setsign-xxxx.onrender.com` 에서 주문하고, `https://setsign-xxxx.onrender.com/admin.html` 에서 입금을 확인해요.

- 무료 서버는 15분 동안 접속이 없으면 잠들어서, 다시 열 때 1분쯤 걸려요.
- 무료 서버의 회원·주문 데이터는 재배포하거나 잠들면 지워져요. 실제 판매 전에는 데이터베이스를 연결하세요.
- `render.yaml`의 계좌·설정 값은 `sync: false`라서, 대시보드에서 넣은 값을 배포 때 덮어쓰지 않아요.

## 페이지 구성

메뉴 10개가 각각 다른 페이지예요. 메뉴는 어느 화면에서나 위에 고정돼 있어서 모든 페이지가 한 번에 열려요.

| 메뉴 | 파일 | 상세페이지 |
|---|---|---|
| 홈 | `index.html` (3D 물병, 스크롤 사용법, 직접 해 보기) | |
| 제품 | `product.html` | `product/band.html`, `pocket.html`, `balance-pad.html`, `pet-bottle.html` |
| 사용법 | `how.html` | `how/step-1.html` ~ `step-4.html` |
| 카드 | `cards.html` | `cards/together.html`, `set.html`, `left2.html`, `last.html`, `away.html`, `spot.html` |
| 사이즈 | `size.html` (사이즈 찾기) | `size/s.html`, `size/l.html` |
| 내향인 테스트 | `test.html` | |
| 영상 | `videos.html` | |
| 구매 | `shop.html` | |
| FAQ | `faq.html` | |
| 문의 | `contact.html` (QR코드) | |

약관: `terms.html`, `privacy.html`, `refund.html` · 없는 주소: `404.html`

## 고치는 법

페이지 HTML은 `tools/build.py`가 만들어요. 문구를 바꿀 때는 `tools/build.py`(상세페이지 내용)나 `tools/parts/`(섹션 조각)를 고친 뒤 실행하세요.

```bash
python3 tools/build.py
```

## 파일

- `assets/site.css` — 전체 디자인 (휴대폰·태블릿·PC 반응형)
- `assets/ui.js` — 스크롤 연출, 등장 효과, 앱 설치
- `assets/shop.js` — 구글 로그인, 주문서, 계좌 안내, 주문 내역, 사이즈 찾기
- `assets/quiz.js` — 내향인 테스트 (질문 300개)
- `assets/bottle3d.js` — 3D 물병 (홈)
- `assets/qr-setsign.png`, `qr-setsign.svg` — 사이트로 이동하는 정적 QR코드 (만료 없음)
- `videos/` — 숏폼 3편 + 60초 소개 영상 (세로 1080×1920, AI 생성)
- `admin.html` — 판매자용 주문 관리 (입금 확인·취소)
- `server.mjs` — 구글 로그인 검증·주문·입금 확인 API, 페이지·영상 전송, 외부 패키지 없음
- `render.yaml`, `package.json` — Render 배포 설정
- `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` — 앱 설치(PWA)

사이트의 3D 쉐이커·카드·일러스트·영상은 AI로 만든 그래픽이에요. 글꼴은 Black Han Sans·Anton·Noto Sans KR(SIL OFL), 3D는 three.js(MIT)를 써요. 영상 배경음은 코드로 직접 합성했어요.
