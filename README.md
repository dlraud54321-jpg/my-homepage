# SETSIGN 세트사인

말 대신, 꽂아. — 물병에 끼우고, 카드만 바꿔 꽂으면 끝.

헬스장에서 "같이 쓰실래요?"를 말하기 어려운 사람을 위한 물병 카드 밴드 홈페이지예요.

## 두 가지 모드

| | 파일만 열기 · GitHub Pages | `server.mjs` 실행 |
|---|---|---|
| 디자인, 3D 쉐이커, 내향인 테스트 | ✅ | ✅ |
| 사이즈 직접 계산, 데모 주문 | ✅ (데모 모드) | ✅ |
| 토스페이먼츠 결제(카드·계좌이체), 무통장 입금 | ❌ | ✅ |
| 이메일 인증, 쉐이커 사이즈 검색 | ❌ | ✅ |

## 서버 실행 (Node.js 18 이상)

```bash
TOSS_CLIENT_KEY=test_ck_... TOSS_SECRET_KEY=test_sk_... node server.mjs
```

터미널에 표시되는 주소(기본 http://localhost:8080)를 브라우저로 여세요. 8080이 사용 중이면 다음 번호로 자동으로 옮겨요.

| 환경 변수 | 용도 |
|---|---|
| `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | 토스페이먼츠 결제 (개발자 센터의 `test_ck_` / `test_sk_` 키) |
| `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` | 무통장 입금 안내 계좌 |
| `ADMIN_TOKEN` | 무통장 입금 확인 API (`POST /api/admin/deposit`) |
| `ANTHROPIC_API_KEY` | 쉐이커 제품명으로 지름 검색 |
| `SHOW_VERIFY_CODE` | `1`이면 인증 코드를 화면에 표시 (테스트 전용) |
| `PORT`, `SHIPPING_FEE`, `DB_FILE` | 포트, 배송비, 데이터 파일 위치 |

> 시크릿 키와 토큰은 환경 변수로만 넣고, 이 저장소에는 절대 커밋하지 마세요. 회원·주문 데이터(`data.json`)는 `.gitignore`에 들어 있어요.

## 인터넷 주소로 진짜 결제창 테스트하기 (Render)

1. [render.com](https://render.com)에 GitHub 계정으로 가입해요.
2. 대시보드에서 **New → Blueprint**를 누르고 이 저장소(`my-homepage`)를 골라요. `render.yaml`대로 서비스가 만들어져요.
3. `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` 칸에 토스페이먼츠 개발자 센터의 테스트 키(`test_ck_…`, `test_sk_…`)를 넣고 **Deploy**를 눌러요.
4. 배포가 끝나면 `https://setsign-xxxx.onrender.com` 같은 주소가 생겨요. 그 주소로 들어가 회원가입 → 주문 → 결제하기를 누르면 토스 결제창이 떠요.

- 무료 서버는 15분 동안 접속이 없으면 잠들어서, 다시 열 때 1분쯤 걸려요.
- 무료 서버의 회원·주문 데이터는 재배포하거나 잠들면 지워져요. 테스트용으로만 쓰세요.
- `SHOW_VERIFY_CODE=1`이면 인증 코드가 메일 대신 화면에 떠요. 실제 운영 전에는 지우고 메일 발송을 연결하세요.

## 파일

- `index.html` — 홈페이지 전체 (3D, 내향인 테스트, 주문·결제 화면)
- `render.yaml`, `package.json` — Render 배포 설정
- `server.mjs` — 회원가입·이메일 인증·주문·결제 승인(금액 서버 재확인) API, 외부 패키지 없음
- `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` — 앱 설치(PWA)

페이지의 3D 쉐이커·카드·일러스트는 AI로 만든 그래픽이에요.
