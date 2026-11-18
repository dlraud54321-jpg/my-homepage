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
| 주문 관리(입금 확인), 이메일 인증, 쉐이커 사이즈 검색 | ❌ | ✅ |

## 서버 실행 (Node.js 18 이상)

```bash
BANK_NAME=○○은행 BANK_ACCOUNT=000-0000-0000 BANK_HOLDER=예금주 ADMIN_TOKEN=관리자-비밀번호 node server.mjs
```

터미널에 표시되는 주소(기본 http://localhost:8080)를 브라우저로 여세요. 8080이 사용 중이면 다음 번호로 자동으로 옮겨요.

| 환경 변수 | 용도 |
|---|---|
| `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` | 주문 대금을 받을 계좌 (필수, 사업자 계좌 권장) |
| `ADMIN_TOKEN` | 주문 관리 페이지 비밀번호 (필수, 길고 추측하기 어렵게) |
| `SHOW_VERIFY_CODE` | `1`이면 인증 코드를 메일 대신 화면에 표시 (테스트 전용) |
| `BREVO_API_KEY`, `MAIL_FROM` | 인증 메일 실제 발송. Brevo 무료 플랜(하루 300통)의 API 키와, Brevo에서 인증한 보내는 사람 이메일 (`RESEND_API_KEY`도 가능, `MAIL_FROM_NAME` 선택) |
| `ANTHROPIC_API_KEY` | 쉐이커 제품명으로 지름 검색 (선택) |
| `PORT`, `SHIPPING_FEE`, `DB_FILE` | 포트, 배송비, 데이터 파일 위치 |

> 계좌번호·비밀번호는 환경 변수로만 넣고, 이 저장소에는 커밋하지 마세요. 회원·주문 데이터(`data.json`)는 `.gitignore`에 들어 있어요.

## 인터넷 주소로 주문 테스트하기 (Render)

1. [render.com](https://render.com)에 GitHub 계정으로 가입해요.
2. 대시보드에서 **New → Blueprint**를 누르고 이 저장소(`my-homepage`)를 골라요. `render.yaml`대로 서비스가 만들어져요.
3. `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER` 칸을 채우고 **Deploy**를 눌러요. `ADMIN_TOKEN`은 Render가 만들어 줘요.
4. 배포가 끝나면 생기는 `https://setsign-xxxx.onrender.com` 에서 주문하고, `https://setsign-xxxx.onrender.com/admin.html` 에서 입금을 확인해요.

- 무료 서버는 15분 동안 접속이 없으면 잠들어서, 다시 열 때 1분쯤 걸려요.
- 무료 서버의 회원·주문 데이터는 재배포하거나 잠들면 지워져요. 실제 판매 전에는 데이터베이스를 연결하세요.
- `SHOW_VERIFY_CODE=1`은 테스트용이에요. 실제 운영 전에는 지우고 메일 발송을 연결하세요.
- Render 무료 서버는 SMTP(메일 포트)가 막혀 있어요. 그래서 인증 메일은 Brevo·Resend 같은 HTTP 메일 API로 보내요.
- `render.yaml`의 계좌·설정 값은 `sync: false`라서, 대시보드에서 넣은 값을 배포 때 덮어쓰지 않아요.

## 파일

- `index.html` — 홈페이지 전체 (3D, 내향인 테스트, 주문·계좌 안내 화면)
- `admin.html` — 판매자용 주문 관리 (입금 확인·취소)
- `server.mjs` — 회원가입·이메일 인증·주문·입금 확인 API, 외부 패키지 없음
- `render.yaml`, `package.json` — Render 배포 설정
- `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` — 앱 설치(PWA)

페이지의 3D 쉐이커·카드·일러스트는 AI로 만든 그래픽이에요.
