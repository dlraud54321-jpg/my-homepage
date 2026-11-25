# SETSIGN 홈페이지 빌드: 공통 머리말·메뉴·바닥글을 붙여 페이지 파일을 만들어요.
# 실행: python3 tools/build.py  (저장소 맨 위 폴더에서)
import html, json, os, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
P = ROOT / 'tools' / 'parts'
part = lambda n: (P / n).read_text(encoding='utf-8')
SITE_URL = 'https://setsign.onrender.com'

NAV = [
    ('index', '홈', 'index.html'), ('product', '제품', 'product.html'), ('how', '사용법', 'how.html'),
    ('cards', '카드', 'cards.html'), ('size', '사이즈', 'size.html'), ('test', '<span class="lg">내향인 </span>테스트', 'test.html'),
    ('videos', '영상', 'videos.html'), ('shop', '구매', 'shop.html'), ('faq', 'FAQ', 'faq.html'), ('contact', '문의', 'contact.html'),
]

CARDS = [
    dict(key='together', n='01', t='같이 써요', s='교대로 쓰셔도 돼요', cls='c-orange', bar='var(--navy)',
         lede='쉬는 동안 기구를 다른 사람이 써도 괜찮다는 뜻이에요. 헬스장에서 제일 하기 어려운 말을 대신해요.',
         when=['세트 사이에 1~2분 쉬는 동안', '벤치·랙을 혼자 오래 차지하고 있을 때', '옆 사람이 내 기구를 쳐다보며 기다릴 때'],
         them='카드를 본 사람은 “써도 될까요?”를 묻지 않고 바로 들어와 한 세트 하고 비켜 주면 돼요.',
         next='set', tip='앞 칸에 이 카드를, 뒤 칸에 ‘세트 중’을 넣어 두면 내 차례가 왔을 때 한 번에 바꿔 꽂을 수 있어요.'),
    dict(key='set', n='02', t='세트 중', s='지금 운동 중이에요', cls='c-navy', bar='var(--orange)',
         lede='잠깐 일어나 있어도 아직 이 기구를 쓰고 있다는 표시예요. 자리를 비운 줄 알고 치워지는 일을 막아요.',
         when=['세트 사이에 일어나서 스트레칭할 때', '원판을 바꾸러 잠깐 자리를 떴을 때', '폼을 거울로 확인하느라 벤치에서 일어났을 때'],
         them='카드를 본 사람은 다른 기구를 먼저 쓰거나 잠시 기다리면 돼요.',
         next='left2', tip='세트가 거의 끝나 가면 ‘2세트 남음’으로 바꿔 꽂아 기다리는 사람에게 남은 시간을 알려 주세요.'),
    dict(key='left2', n='03', t='2세트 남음', s='조금만 기다려 주세요', cls='c-white', bar='var(--orange)',
         lede='기다리는 사람이 얼마나 더 기다려야 하는지 알 수 있게 해 줘요. “얼마나 남으셨어요?”라는 질문이 필요 없어요.',
         when=['누군가 내 기구 주변에서 기다리는 게 보일 때', '인기 기구(스쿼트 랙, 벤치)를 쓰는 저녁 시간', '마지막 운동 종목을 시작할 때'],
         them='카드를 본 사람은 근처에서 다른 운동을 하다가 돌아오면 돼요.',
         next='last', tip='세트를 하나 끝낼 때마다 마음속으로 세다가, 마지막 세트에 들어가면 ‘마지막 세트’로 바꿔요.'),
    dict(key='last', n='04', t='마지막 세트', s='곧 자리 비워요', cls='c-orange', bar='var(--white)',
         lede='이 세트만 끝나면 자리를 비운다는 뜻이에요. 기다리던 사람이 준비를 시작할 수 있어요.',
         when=['마지막 한 세트를 시작하기 직전', '운동을 마무리하고 정리 운동으로 넘어갈 때', '기다리는 사람이 둘 이상일 때'],
         them='카드를 본 사람은 바로 옆에서 워밍업을 시작해도 돼요.',
         next='away', tip='세트가 끝나면 원판을 정리하고 카드를 ‘같이 써요’로 돌려놓으면 다음 사람에게 깔끔하게 넘어가요.'),
    dict(key='away', n='05', t='잠깐 비움', s='물 마시고 올게요', cls='c-navyo', bar='var(--white)',
         lede='화장실·정수기에 잠깐 다녀온다는 표시예요. 소지품만 두고 사라진 사람처럼 보이지 않게 해 줘요.',
         when=['정수기·화장실에 다녀올 때', '탈의실에 장갑·스트랩을 가지러 갈 때', '전화를 잠깐 받으러 나갈 때'],
         them='카드를 본 사람은 금방 돌아올 거라는 걸 알고, 짐을 옮기지 않고 기다리거나 한 세트만 하고 비켜 주면 돼요.',
         next='spot', tip='5분 넘게 자리를 비울 거라면 카드를 ‘같이 써요’로 바꿔 두는 게 매너예요.'),
    dict(key='spot', n='06', t='스팟 가능', s='보조 필요하면 불러 주세요', cls='c-white', bar='var(--navy)',
         lede='무거운 무게를 드는 사람을 보조(스팟)해 줄 수 있다는 표시예요. 말 걸기 어려운 사람끼리도 도움을 주고받을 수 있어요.',
         when=['벤치프레스·스쿼트 옆에서 쉬는 동안', '함께 운동할 사람을 찾을 때', '헬스장 크루·동호회 모임에서'],
         them='보조가 필요한 사람은 카드 주인에게 손짓 한 번이면 돼요. 서로 말 꺼낼 부담이 줄어요.',
         next='together', tip='보조를 받고 싶을 때는 이 카드를 거꾸로(뒷면이 보이게) 꽂는 식으로 헬스장 친구들과 신호를 정해 써도 좋아요.'),
]
CBY = {c['key']: c for c in CARDS}

SIZES = [
    dict(key='s', letter='S', t='S · 슬림·캡슐', d='지름 약 7.5–9cm', c='둘레 약 23.5–28.3cm',
         lede='위아래가 둥근 캡슐형 쉐이커, 400~600mL급 작은 쉐이커, 슬림 텀블러에 맞춰요.',
         fits=['캡슐형(공 모양) 프로틴 쉐이커', '400~600mL급 쉐이커', '슬림 텀블러·보온병'],
         how='캡슐형은 몸통 가운데 곧은 부분에 끼워 주세요. 둥근 부분에 걸면 밴드가 미끄러질 수 있어요.',
         stab='캡슐형은 바닥이 좁아 기본형보다 덜 버텨요. 거의 빈 상태에서 약 17°까지 기울어도 버티도록 설계했어요.',
         svg='s'),
    dict(key='l', letter='L', t='L · 와이드', d='지름 약 9–10.5cm', c='둘레 약 28.3–33cm',
         lede='700~900mL급 프로틴 쉐이커, 대용량 텀블러·보틀처럼 굵은 물병에 맞춰요.',
         fits=['700~900mL급 프로틴 쉐이커', '대용량 텀블러', '굵은 다회용 보틀'],
         how='쉐이커 눈금이 있는 몸통 중간에 끼우고, 카드 포켓이 앞으로 오게 한 바퀴 돌려 맞춰요.',
         stab='빈 700mL 쉐이커 기준 약 24°까지 기울어도 버텨요. 아무것도 안 끼운 빈 쉐이커(23°)보다 조금 더 안정적이에요.',
         svg='l'),
]

STEPS = [
    dict(n='1', t='끼운다', lede='실리콘 밴드를 물병 가운데에 쭉 끼워요.',
         do=['밴드를 물병 아래쪽부터 위로 밀어 올려요.', '눈금이 있는 몸통 가운데쯤에서 멈춰요.', '카드 포켓이 내 쪽(앞)으로 오게 한 바퀴 돌려 맞춰요.'],
         miss='뚜껑 쪽 좁은 목이나 둥근 바닥에 걸면 밴드가 헐거워져요. 곧은 몸통에 끼우세요.'),
    dict(n='2', t='뽑는다', lede='상태가 바뀌면 앞 칸 카드를 옆 입구로 쓱 밀어 빼요.',
         do=['포켓 옆쪽이 열려 있어요. 엄지로 앞 칸 카드를 옆으로 밀어요.', '카드가 반쯤 나오면 손가락으로 집어 빼요.', '뚜껑을 열거나 밴드를 뺄 필요는 없어요.'],
         miss='카드를 위로 당기면 포켓이 늘어날 수 있어요. 꼭 옆으로 밀어 빼세요.'),
    dict(n='3', t='바꿔 꽂는다', lede='뒤 칸 카드는 앞 칸으로, 뺀 카드는 뒤 칸으로.',
         do=['뒤 칸에 대기 중이던 카드를 앞 칸으로 옮겨요.', '방금 뺀 카드를 뒤 칸에 넣어 두면 다음에 또 바로 꺼내 쓸 수 있어요.', '나머지 카드는 가방이나 지갑에 보관해요.'],
         miss='두 칸에 카드를 모두 비워 두면 포켓이 접혀 다음 카드를 넣기 어려워요. 뒤 칸에는 늘 한 장을 넣어 두세요.'),
    dict(n='4', t='두면 끝', lede='벤치 옆에 세워 두세요. 말은 필요 없어요.',
         do=['카드가 기다리는 사람 쪽을 보게 물병을 세워요.', '쉐이커에 물이 거의 없어도 뒷면 균형 패드가 포켓 무게를 받쳐 줘요.', '운동이 끝나면 ‘같이 써요’로 돌려놓고 자리를 비워요.'],
         miss='일회용 생수병은 물이 줄면 쓰러지기 쉬워요. 쉐이커·텀블러에 써 주세요.'),
]

PARTS = [
    dict(key='band', t='실리콘 밴드', s='18g · 두께 1.3mm · 높이 5cm', lede='물병을 감싸는 본체예요. 위아래 테두리를 도톰하게 만들어 쉐이커에 단단히 물려요.',
         pts=[('소재', '식품용 실리콘. 물에 젖어도 미끄러지지 않고, 세척할 때는 물로 헹구면 돼요.'), ('사이즈', 'S(지름 7.5–9cm), L(지름 9–10.5cm) 두 가지예요. 조금 늘어나서 범위 안의 물병에 꼭 맞아요.'), ('테두리', '위아래 가장자리만 두껍게 해서 물병에 물리는 힘을 높였어요.')]),
    dict(key='pocket', t='2겹 카드 포켓', s='TPU 0.8mm 2겹 · 약 11.5g', lede='카드 2장이 앞뒤로 들어가는 투명 포켓이에요. 옆이 열려 있어서 카드를 옆으로 밀어 바꿔요.',
         pts=[('앞 칸', '지금 상태를 보여 주는 카드를 꽂아요.'), ('뒤 칸', '다음에 쓸 카드가 대기해요. 바꿀 때 앞뒤만 옮기면 돼요.'), ('카드 규격', '신용카드와 같은 85.6×54mm, 두께 0.5mm PP 카드예요. 장당 약 2.1g.')]),
    dict(key='balance-pad', t='뒷면 균형 패드', s='20g · 120° 구간 4mm', lede='포켓 반대편을 4mm 두껍게 만들어 포켓 무게를 맞받쳐요. 거의 빈 쉐이커도 포켓 쪽으로 쏠리지 않게 해 줘요.',
         pts=[('왜 필요할까', '포켓은 한쪽에만 달려 있어서 그대로 두면 무게중심이 포켓 쪽으로 약 5mm 쏠려요.'), ('효과', '균형 패드를 덧대면 쏠림이 0mm가 되고, 빈 쉐이커가 버티는 기울기가 21°에서 24°로 늘어나요.'), ('제작', '밴드와 같은 금형에서 한 번에 찍어 내서 추가 부품도 조립도 없어요. 손에 쥘 때 미끄럼 방지 그립 역할도 해요.')]),
    dict(key='pet-bottle', t='일회용 생수병 주의', s='권장하지 않아요', lede='편의점에서 파는 얇은 일회용 플라스틱 생수병에는 SETSIGN을 권장하지 않아요.',
         pts=[('무게 차이', '빈 500mL 생수병은 10~15g인데 키트는 약 54g이에요. 물이 다 떨어지면 키트가 물병보다 4배 넘게 무거워져 쓰러지기 쉬워요.'), ('얇은 벽', '쥐면 찌그러져서 밴드가 미끄러지고 제자리를 유지하기 어려워요.'), ('이렇게 써 주세요', '프로틴 쉐이커나 텀블러처럼 단단한 다회용 물병에 써 주세요.')]),
]

VIDEOS = [
    dict(key='short-1', t='숏폼 1 · 15초 사용법', d='끼우고, 뽑고, 바꿔 꽂고, 두면 끝. 사용법 4단계를 20초에 보여 줘요.', file='videos/setsign-short-1-how.mp4', poster='videos/setsign-short-1-how.jpg', page='how'),
    dict(key='short-2', t='숏폼 2 · 상황별 카드 6장', d='“같이 쓰실래요?” 대신 꽂는 카드 6장을 비트에 맞춰 한 장씩 소개해요.', file='videos/setsign-short-2-cards.mp4', poster='videos/setsign-short-2-cards.jpg', page='cards'),
    dict(key='short-3', t='숏폼 3 · 사이즈와 주의사항', d='S·L 고르는 법, 거의 빈 쉐이커도 버티는 설계, 일회용 생수병 주의, 가격까지.', file='videos/setsign-short-3-size.mp4', poster='videos/setsign-short-3-size.jpg', page='size'),
]
MAIN_VIDEO = dict(t='브랜드 영상 · 60초', d='SETSIGN을 처음 보는 사람을 위한 60초 소개 영상이에요.', file='videos/setsign-intro-60s.mp4', poster='videos/setsign-intro-60s.jpg')

# ---------------------------------------------------------------- 공통 조각
def esc(s): return html.escape(s, quote=True)

def header(cur, R, parent=None):
    links = []
    for key, label, href in NAV:
        a = ' aria-current="page"' if key == cur else (' aria-current="true"' if key == parent else '')
        links.append(f'<a href="{R}{href}"{a}>{label}</a>')
    return f'''<header class="hd">
  <a class="logo" href="{R}index.html" aria-label="SETSIGN 세트사인 홈">SETSIGN <small>세트사인</small></a>
  <nav aria-label="주요 메뉴">{''.join(links)}</nav>
  <div class="hd-act">
    <button class="btn btn-ghost" id="btn-account" type="button">로그인</button>
    <button class="btn btn-o" type="button" data-buy>주문하기</button>
  </div>
</header>'''

def footer(R):
    sitemap = ''.join(f'<li><a href="{R}{h}">{re.sub("<[^>]+>", "", l)}</a></li>' for _, l, h in NAV)
    return f'''<div class="tape" aria-hidden="true"></div>
<footer class="ft navy">
  <nav class="ft-map" aria-label="전체 페이지"><ul>{sitemap}</ul></nav>
  <!-- TODO: 실제 문의 이메일로 바꾸세요. 개인 전화번호·집 주소는 넣지 마세요. -->
  <dl class="biz">
    <div><dt>상호</dt><dd>SETSIGN 세트사인</dd></div>
    <div><dt>운영</dt><dd>대학 과제 프로젝트 · 시범 판매</dd></div>
    <div><dt>이메일</dt><dd>hello@example.com</dd></div>
    <div><dt>호스팅</dt><dd>Render(서버) · GitHub(소스)</dd></div>
  </dl>
  <ul class="legal">
    <li><a href="{R}terms.html">이용약관</a></li>
    <li><a href="{R}privacy.html"><b>개인정보처리방침</b></a></li>
    <li><a href="{R}refund.html">교환·환불 정책</a></li>
  </ul>
  <p><b>AI 활용 표기</b> · 이 사이트의 3D 물병, 카드 디자인, 일러스트, 소개 영상은 AI로 만든 그래픽이에요(AI 생성). 실제 제품과 다를 수 있어요.</p>
  <p><b>출처</b> · 글꼴 Black Han Sans·Anton·Noto Sans KR (SIL Open Font License) · 3D three.js (MIT License) · 영상 배경음은 코드로 직접 합성해 저작권 음원을 쓰지 않았어요.</p>
  <p>© <span id="yr">2026</span> SETSIGN. 결제: 계좌이체</p>
  <div class="ft-giant" aria-hidden="true">SETSIGN</div>
</footer>'''

def page(path, cur, title, desc, body, parent=None, three=False, quiz=False, cls=''):
    depth = path.count('/')
    R = '../' * depth
    head_extra = '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>\n' if three else ''
    canvas = '<canvas id="gl" aria-hidden="true"></canvas>\n<div id="labels" aria-hidden="true"></div>\n' if three else ''
    full_title = title if path == 'index.html' else f'{title} · SETSIGN 세트사인'
    doc = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<script>document.documentElement.className='js'</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#0E1240">
<link rel="manifest" href="{R}manifest.webmanifest">
<link rel="apple-touch-icon" href="{R}icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="SETSIGN">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE_URL}/{'' if path == 'index.html' else path}">
<meta property="og:image" content="{SITE_URL}/icon-512.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230E1240'/%3E%3Crect x='7' y='9' width='18' height='14' fill='%23FF5A1F'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
{head_extra}<link rel="stylesheet" href="{R}assets/site.css">
</head>
<body data-root="{R}" data-page="{cur}" class="{cls}">
<a class="skip" href="#main">본문 바로가기</a>

{header(cur, R, parent)}

{canvas}<div id="cur" aria-hidden="true"><span>DRAG</span></div>

<main id="main">
{body}
</main>

{footer(R)}

{part('dlg-shop.html')}

{part('dlg-doc.html')}
{part('doc-templates.html')}
{part('dlg-quiz.html') if quiz else ''}
<script src="{R}assets/ui.js"></script>
{f'<script src="{R}assets/quiz.js"></script>' if quiz else ''}
{f'<script type="module" src="{R}assets/bottle3d.js"></script>' if three else ''}
<script type="module" src="{R}assets/shop.js"></script>
</body>
</html>
'''
    doc = doc.replace('{R}', R)
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')
    PAGES.append(path)

PAGES = []

def page_head(eyebrow, h1, lede, theme='navy', extra=''):
    return f'''<section class="ph {theme}">
  <p class="eyebrow">{eyebrow}</p>
  <h1 class="ph-h">{h1}</h1>
  <p class="lede">{lede}</p>{extra}
</section>'''

def crumbs(items, R):
    li = []
    for i, (label, href) in enumerate(items):
        li.append(f'<li><a href="{R}{href}">{label}</a></li>' if href else f'<li aria-current="page">{label}</li>')
    return f'<nav class="crumbs" aria-label="현재 위치"><ol>{"".join(li)}</ol></nav>'

def tabs(items, cur, R, label):
    cur_attr = ' aria-current="page"'
    a = ''.join(f'<a href="{R}{h}"{cur_attr if k == cur else ""}>{t}</a>' for k, t, h in items)
    return f'<nav class="tabs" aria-label="{label}">{a}</nav>'

def card_html(c, tag='div', href=None, big=False):
    inner = f'<span class="cn"><span>SETSIGN</span><span>{c["n"]}</span></span><span><b>{c["t"]}</b><span class="cs">{c["s"]}</span></span><span class="bar" style="background:{c["bar"]}"></span>'
    if href: return f'<a class="ss-card {c["cls"]}{" big-card" if big else ""}" href="{href}">{inner}</a>'
    return f'<div class="ss-card {c["cls"]}{" big-card" if big else ""}" role="img" aria-label="{c["t"]} 카드 (AI 생성 디자인)">{inner}</div>'

def video_html(v, R, cls=''):
    return f'''<figure class="vid {cls}">
  <video controls playsinline preload="metadata" poster="{R}{v['poster']}"><source src="{R}{v['file']}" type="video/mp4">브라우저가 영상을 재생하지 못해요. <a href="{R}{v['file']}">영상 파일 받기</a></video>
  <figcaption><b>{v['t']}</b><span>{v['d']}</span><a href="{R}{v['file']}" download>영상 파일 받기 (MP4)</a><span class="ai-tag">AI 생성 영상</span></figcaption>
</figure>'''

def cta_band(R, text='9,900원 · 밴드 + 2겹 포켓 + 카드 6장'):
    return f'''<section class="cta-band orange">
  <p>{text}</p>
  <div class="cta"><button class="btn btn-n" type="button" data-buy>바로 주문하기</button><a class="btn btn-ghost" href="{R}shop.html">가격·주문 방법 보기</a></div>
</section>'''

# SVG 일러스트 (AI 생성)
def shaker_svg(step=None, w=240):
    base = '''<path d="M58 70h124l-10 210q-1 14-15 14H83q-14 0-15-14z" fill="#F5F5F0" stroke="#0E1240" stroke-width="5" stroke-linejoin="round"/>
<rect x="52" y="40" width="136" height="32" rx="6" fill="#FF5A1F" stroke="#0E1240" stroke-width="4"/>
<rect x="88" y="22" width="64" height="20" rx="5" fill="#0E1240"/>
<path d="M74 110h16M75 130h10M76 150h16M77 170h10" stroke="#0E1240" stroke-width="3" opacity=".5"/>'''
    band = '<rect x="62" y="166" width="116" height="56" fill="#0E1240"/><rect x="88" y="172" width="64" height="44" fill="#F5F5F0" stroke="#FF5A1F" stroke-width="3"/>'
    cardA = '<rect x="92" y="176" width="56" height="36" fill="#FF5A1F" stroke="#0E1240" stroke-width="2"/>'
    arrow = lambda d: f'<path d="{d}" fill="none" stroke="#FF5A1F" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/>'
    extra = ''
    if step == '1':
        body = base + '<g transform="translate(0 -70)">' + band + cardA + '</g>' + arrow('M210 96v70M196 152l14 14 14-14')
    elif step == '2':
        body = base + band + '<rect x="150" y="180" width="56" height="36" fill="#FF5A1F" stroke="#0E1240" stroke-width="2"/>' + arrow('M160 240h56M202 226l14 14-14 14')
    elif step == '3':
        body = base + band + '<rect x="92" y="176" width="56" height="36" fill="#F5F5F0" stroke="#0E1240" stroke-width="2"/>' + arrow('M196 150q30 30 0 60M190 200l6 10 10-4') + arrow('M44 210q-30-30 0-60M50 160l-6-10-10 4')
    elif step == '4':
        body = base + band + cardA + '<path d="M10 296h220" stroke="#0E1240" stroke-width="6"/>' + arrow('M186 96l14 14 28-28')
    else:
        body = base + band + cardA
    return f'<svg class="ill" viewBox="0 0 240 300" width="{w}" role="img" aria-label="사용법 {step or ""}단계 일러스트 (AI 생성)">{body}</svg>'

SIZE_SVG = {
    's': part('sec-size.html').split('<svg viewBox="0 0 200 310"')[1].split('</svg>')[0],
    'l': part('sec-size.html').split('<svg viewBox="0 0 200 310"')[2].split('</svg>')[0],
}
def size_svg(k):
    inner = SIZE_SVG[k]
    return f'<svg class="ill on-navy" viewBox="0 0 200 310"{inner}</svg>'

PART_SVG = {
    'band': '<svg class="ill" viewBox="0 0 240 240" role="img" aria-label="위에서 본 실리콘 밴드 (AI 생성)"><circle cx="120" cy="120" r="84" fill="none" stroke="#0E1240" stroke-width="22"/><circle cx="120" cy="120" r="70" fill="none" stroke="#FF5A1F" stroke-width="3" stroke-dasharray="6 7"/><text x="120" y="128" text-anchor="middle" font-family="Anton" font-size="26" fill="#0E1240">1.3mm</text></svg>',
    'pocket': '<svg class="ill" viewBox="0 0 240 240" role="img" aria-label="2겹 카드 포켓 (AI 생성)"><rect x="40" y="62" width="150" height="104" fill="#F5F5F0" stroke="#0E1240" stroke-width="4"/><rect x="54" y="74" width="150" height="104" fill="#FF5A1F" stroke="#0E1240" stroke-width="4"/><path d="M204 126h26M218 112l14 14-14 14" stroke="#0E1240" stroke-width="6" fill="none"/><text x="128" y="134" text-anchor="middle" font-family="Black Han Sans" font-size="26" fill="#0E1240">앞 칸</text><text x="70" y="208" font-family="Noto Sans KR" font-weight="700" font-size="15" fill="#0E1240">옆 입구로 밀어 바꿔요</text></svg>',
    'balance-pad': '<svg class="ill" viewBox="0 0 240 240" role="img" aria-label="위에서 본 균형 패드 (AI 생성)"><circle cx="120" cy="120" r="70" fill="none" stroke="#0E1240" stroke-width="3"/><circle cx="120" cy="120" r="78" fill="none" stroke="#0E1240" stroke-width="10"/><path d="M52 80A78 78 0 0 0 52 160" fill="none" stroke="#FF5A1F" stroke-width="24"/><rect x="194" y="76" width="20" height="88" fill="#FF5A1F" stroke="#0E1240" stroke-width="3"/><circle cx="120" cy="120" r="5" fill="#0E1240"/><text x="44" y="214" font-family="Noto Sans KR" font-weight="700" font-size="14" fill="#0E1240">패드 20g</text><text x="160" y="214" font-family="Noto Sans KR" font-weight="700" font-size="14" fill="#0E1240">포켓 16g</text></svg>',
    'pet-bottle': '<svg class="ill" viewBox="0 0 240 240" role="img" aria-label="일회용 생수병에 X 표시 (AI 생성)"><path d="M104 20h32v20c0 8 16 18 16 38v130c0 10-6 16-16 16h-32c-10 0-16-6-16-16V78c0-20 16-30 16-38z" fill="none" stroke="#0E1240" stroke-width="6"/><path d="M40 40l160 160M200 40L40 200" stroke="#FF5A1F" stroke-width="16"/></svg>',
}

# ---------------------------------------------------------------- 페이지
def build():
    R = ''
    # 홈 -----------------------------------------------------------
    hero = part('sec-top.html').replace('href="#try">직접 해 보기', 'href="#try">3D로 직접 해 보기')
    notice = part('notice.html').replace('<a href="#size">자세히</a>', '<a href="product/pet-bottle.html">자세히</a>')
    how = part('sec-how.html')
    trys = part('sec-try.html')
    tiles = [
        ('product.html', '제품', '구성과 무게 설계', '실리콘 밴드, 2겹 포켓, 균형 패드까지 구조를 한눈에.'),
        ('how.html', '사용법', '4단계면 끝', '끼운다 · 뽑는다 · 바꿔 꽂는다 · 두면 끝.'),
        ('cards.html', '카드', '상황별 카드 6장', '같이 써요부터 스팟 가능까지, 카드마다 쓰는 법.'),
        ('size.html', '사이즈', 'S · L 고르기', '쉐이커 이름만 적으면 맞는 사이즈를 찾아 드려요.'),
        ('test.html', '내향인 테스트', '나는 몇 퍼센트?', '질문 300개 중 매번 다른 10개, 1분이면 끝나요.'),
        ('videos.html', '영상', '숏폼 3편 + 60초 영상', '사용법·카드·사이즈를 짧은 영상으로.'),
        ('shop.html', '구매', '9,900원', '주문하면 입금 계좌가 바로 안내돼요.'),
        ('faq.html', 'FAQ', '자주 묻는 질문', '맞는 물병, 결제, 배송·환불까지.'),
        ('contact.html', '문의', '메일과 QR코드', '휴대폰으로 사이트를 바로 여는 QR도 여기 있어요.'),
    ]
    tiles_html = '<section class="sec white jump"><p class="eyebrow">한 번에 가기</p><h2 class="big">어디부터<br>볼까요?</h2><ul class="tiles">' + ''.join(
        f'<li><a href="{h}"><span class="tl-k">{k}</span><b>{t}</b><span>{d}</span><span class="tl-go" aria-hidden="true">→</span></a></li>' for h, k, t, d in tiles) + '</ul>'
    tiles_html += '<p class="jump-more"><b>바로 보기</b> ' + ' · '.join(f'<a href="cards/{c["key"]}.html">{c["t"]}</a>' for c in CARDS) + ' · <a href="size/s.html">S 사이즈</a> · <a href="size/l.html">L 사이즈</a></p></section>'
    page('index.html', 'index', 'SETSIGN 세트사인 — 말 대신, 꽂아.',
         "물병에 끼우고, 카드만 바꿔 꽂으면 끝. 헬스장에서 '같이 쓰실래요?' 대신 카드로 말하는 물병 카드 밴드, SETSIGN.",
         '\n'.join([hero, notice, how, trys, tiles_html, cta_band('')]), three=True, cls='home')

    # 제품 -----------------------------------------------------------
    R = ''
    spec = part('sec-size.html')
    spec_block = spec[spec.index('<div class="spec up"'):spec.index('<div class="warn up"')]
    warn_block = spec[spec.index('<div class="warn up"'):spec.index('<div class="size-foot">')]
    parts_list = ''.join(f'<li><a href="product/{p["key"]}.html">{PART_SVG[p["key"]]}<b>{p["t"]}</b><span>{p["s"]}</span><span class="tl-go" aria-hidden="true">→</span></a></li>' for p in PARTS)
    parts_list += f'<li><a href="cards.html">{card_html(CARDS[0])}<b>문구 카드 6장</b><span>PP 0.5mm · 신용카드 규격</span><span class="tl-go" aria-hidden="true">→</span></a></li>'
    body = '\n'.join([
        page_head('제품', '밴드 + 2겹 포켓<br><span>+ 카드 6장.</span>', '물병에 끼우는 실리콘 밴드, 카드 2장이 들어가는 2겹 포켓, 상황별 문구 카드 6장. 구조는 이게 전부예요.'),
        part('sec-problem.html').replace('<h2 class="big" id="problem-h">', '<h2 class="big" id="problem-h">'),
        f'<section class="sec white"><p class="eyebrow">구성</p><h2 class="big">하나씩<br>자세히 보기.</h2><ul class="tiles parts">{parts_list}</ul></section>',
        f'<section class="sec navy">{spec_block}<p class="spec-link"><a class="btn btn-ghost" href="product/balance-pad.html">균형 패드 자세히</a></p></section>',
        f'<section class="sec white">{warn_block}<p><a class="btn btn-n" href="product/pet-bottle.html">왜 생수병은 안 될까요?</a></p></section>',
        cta_band(''),
    ])
    page('product.html', 'product', '제품 구성', '실리콘 밴드, 2겹 카드 포켓, 뒷면 균형 패드, 문구 카드 6장. SETSIGN의 구성과 무게 설계.', body)

    for i, p in enumerate(PARTS):
        R = '../'
        pts = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in p['pts'])
        prev, nxt = PARTS[i - 1], PARTS[(i + 1) % len(PARTS)]
        body = f'''<section class="detail white">
  {crumbs([('홈', 'index.html'), ('제품', 'product.html'), (p['t'], None)], R)}
  {tabs([(q['key'], q['t'], f"product/{q['key']}.html") for q in PARTS], p['key'], R, '제품 구조')}
  <div class="dt-grid">
    <div class="dt-vis">{PART_SVG[p['key']]}<span class="ai-tag">AI 생성 일러스트</span></div>
    <div class="dt-copy">
      <p class="eyebrow">제품 구조 {i + 1:02d}</p>
      <h1 class="dt-h">{p['t']}</h1>
      <p class="dt-sub">{p['s']}</p>
      <p class="lede">{p['lede']}</p>
      <dl class="dt-list">{pts}</dl>
      <p class="fine">700mL급 쉐이커 기준으로 계산한 설계 목표값이에요. 시제품으로 실측해 확정할 예정이에요.</p>
    </div>
  </div>
  <nav class="pn" aria-label="이전·다음"><a href="{R}product/{prev['key']}.html">← {prev['t']}</a><a href="{R}product/{nxt['key']}.html">{nxt['t']} →</a></nav>
</section>
{cta_band(R)}'''
        page(f'product/{p["key"]}.html', 'product', p['t'], f'SETSIGN {p["t"]}: {p["lede"]}', body, parent='product')

    # 사용법 ---------------------------------------------------------
    R = ''
    steps = ''.join(f'''<li><a href="how/step-{s['n']}.html">{shaker_svg(s['n'], 180)}<span class="st-n">0{s['n']}</span><b>{s['t']}</b><span>{s['lede']}</span><span class="tl-go" aria-hidden="true">자세히 →</span></a></li>''' for s in STEPS)
    body = '\n'.join([
        page_head('사용법', '끼우고, 뽑고,<br><span>바꿔 꽂으면 끝.</span>', '처음 한 번만 끼우면, 그다음부터는 카드만 바꿔 꽂아요. 단계를 누르면 자세한 방법이 나와요.'),
        f'<section class="sec white"><ol class="tiles steps4">{steps}</ol><p class="ai-note"><span class="ai-tag">AI 생성 일러스트</span></p></section>',
        f'<section class="sec navy vid-sec"><div><p class="eyebrow">숏폼 영상</p><h2 class="big">20초면<br>다 보여요.</h2><p class="lede">사용법 4단계를 짧은 영상으로 확인하세요. 3D로 직접 돌려 보고 싶다면 홈의 <a href="index.html#try">직접 해 보기</a>에서 버튼을 눌러 보세요.</p></div>{video_html(VIDEOS[0], "")}</section>',
        cta_band(''),
    ])
    page('how.html', 'how', '사용법', 'SETSIGN 사용법 4단계: 끼운다, 뽑는다, 바꿔 꽂는다, 두면 끝.', body)

    for i, s in enumerate(STEPS):
        R = '../'
        do = ''.join(f'<li>{x}</li>' for x in s['do'])
        prev, nxt = STEPS[i - 1], STEPS[(i + 1) % 4]
        body = f'''<section class="detail white">
  {crumbs([('홈', 'index.html'), ('사용법', 'how.html'), (f"{s['n']}단계 {s['t']}", None)], R)}
  {tabs([(f"step-{q['n']}", f"0{q['n']} {q['t']}", f"how/step-{q['n']}.html") for q in STEPS], f"step-{s['n']}", R, '사용법 단계')}
  <div class="dt-grid">
    <div class="dt-vis">{shaker_svg(s['n'], 260)}<span class="ai-tag">AI 생성 일러스트</span></div>
    <div class="dt-copy">
      <p class="eyebrow">사용법 {s['n']} / 4</p>
      <h1 class="dt-h"><span class="st-n">0{s['n']}</span> {s['t']}</h1>
      <p class="lede">{s['lede']}</p>
      <h2 class="dt-h2">이렇게 해요</h2>
      <ol class="dt-ol">{do}</ol>
      <div class="dt-warn"><b>자주 하는 실수</b><span>{s['miss']}</span></div>
    </div>
  </div>
  <nav class="pn" aria-label="이전·다음"><a href="{R}how/step-{prev['n']}.html">← {prev['n']}단계 {prev['t']}</a><a href="{R}how/step-{nxt['n']}.html">{nxt['n']}단계 {nxt['t']} →</a></nav>
</section>
{cta_band(R)}'''
        page(f'how/step-{s["n"]}.html', 'how', f'사용법 {s["n"]}단계 · {s["t"]}', f'SETSIGN 사용법 {s["n"]}단계 {s["t"]}: {s["lede"]}', body, parent='how')

    # 카드 -----------------------------------------------------------
    R = ''
    grid = ''.join(f'<li>{card_html(c, href=f"cards/{c["key"]}.html")}<p><b>{c["t"]}</b> · {c["lede"].split(".")[0]}.</p><a class="more" href="cards/{c["key"]}.html">이 카드 자세히 →</a></li>' for c in CARDS)
    body = '\n'.join([
        page_head('카드 6장', '상황마다<br><span>한 장씩.</span>', '카드를 누르면 언제 꽂는지, 받는 사람은 어떻게 하면 되는지 자세히 볼 수 있어요.', theme='orange'),
        f'<section class="sec white"><ul class="card-grid">{grid}</ul><p class="ai-note"><span class="ai-tag">AI 생성 카드 디자인</span></p></section>',
        f'<section class="sec navy vid-sec"><div><p class="eyebrow">숏폼 영상</p><h2 class="big">카드 6장을<br>비트에 맞춰.</h2><p class="lede">“같이 쓰실래요?”가 왜 어려운지, 그리고 카드 6장이 그 말을 어떻게 대신하는지 보여 줘요.</p></div>{video_html(VIDEOS[1], "")}</section>',
        cta_band(''),
    ])
    page('cards.html', 'cards', '카드 6장', 'SETSIGN 문구 카드 6장: 같이 써요, 세트 중, 2세트 남음, 마지막 세트, 잠깐 비움, 스팟 가능.', body)

    for i, c in enumerate(CARDS):
        R = '../'
        when = ''.join(f'<li>{x}</li>' for x in c['when'])
        nc = CBY[c['next']]
        prev, nxt = CARDS[i - 1], CARDS[(i + 1) % 6]
        body = f'''<section class="detail white">
  {crumbs([('홈', 'index.html'), ('카드', 'cards.html'), (c['t'], None)], R)}
  {tabs([(q['key'], q['t'], f"cards/{q['key']}.html") for q in CARDS], c['key'], R, '카드 6장')}
  <div class="dt-grid">
    <div class="dt-vis card-vis">{card_html(c, big=True)}<span class="ai-tag">AI 생성 카드 디자인</span></div>
    <div class="dt-copy">
      <p class="eyebrow">카드 {c['n']} / 06</p>
      <h1 class="dt-h">{c['t']}</h1>
      <p class="dt-sub">“{c['s']}”</p>
      <p class="lede">{c['lede']}</p>
      <h2 class="dt-h2">이럴 때 꽂아요</h2>
      <ul class="dt-ul">{when}</ul>
      <h2 class="dt-h2">카드를 본 사람은</h2>
      <p>{c['them']}</p>
      <div class="dt-tip"><b>뒤 칸 추천 · <a href="{R}cards/{nc['key']}.html">{nc['t']}</a></b><span>{c['tip']}</span></div>
    </div>
  </div>
  <nav class="pn" aria-label="이전·다음"><a href="{R}cards/{prev['key']}.html">← {prev['t']}</a><a href="{R}cards/{nxt['key']}.html">{nxt['t']} →</a></nav>
</section>
{cta_band(R, '카드 6장이 모두 들어 있어요 · 9,900원')}'''
        page(f'cards/{c["key"]}.html', 'cards', f'{c["t"]} 카드', f'SETSIGN {c["t"]} 카드 — {c["s"]}. {c["lede"]}', body, parent='cards')

    # 사이즈 ---------------------------------------------------------
    R = ''
    s = part('sec-size.html')
    sg = s[s.index('<div class="size-grid">'):s.index('<!-- 무게 설계')]
    sg = sg.replace('<button class="btn btn-ghost" type="button" data-size-go="0">3D로 S 보기</button>', '<a class="btn btn-ghost" href="size/s.html">S 사이즈 자세히</a>')
    sg = sg.replace('<button class="btn btn-ghost" type="button" data-size-go="1">3D로 L 보기</button>', '<a class="btn btn-ghost" href="size/l.html">L 사이즈 자세히</a>')
    foot = s[s.index('<div class="size-foot">'):s.index('<!-- 내 물병 사이즈 찾기')]
    fit = s[s.index('<div class="fit" id="fit">'):s.rindex('</section>')]
    body = '\n'.join([
        page_head('사이즈 S · L', '쉐이커 굵기만<br><span>보면 돼요.</span>', '쓰는 쉐이커의 지름(굵기)으로 S와 L 중에 골라요. 제품명만 알려 주면 사이즈를 찾아 드려요.'),
        f'<section class="sec navy size">{sg}{foot}</section>',
        f'<section class="sec navy size">{fit}</section>',
        f'<section class="sec white">{warn_block}</section>',
        f'<section class="sec navy vid-sec"><div><p class="eyebrow">숏폼 영상</p><h2 class="big">사이즈와<br>주의사항.</h2><p class="lede">S·L 고르는 법과 거의 빈 쉐이커도 버티는 설계를 20초에 보여 줘요.</p></div>{video_html(VIDEOS[2], "")}</section>',
        cta_band(''),
    ])
    page('size.html', 'size', '사이즈 S · L', 'SETSIGN 사이즈: S는 지름 7.5–9cm, L은 9–10.5cm. 쉐이커 이름으로 맞는 사이즈를 찾아 드려요.', body)

    for i, z in enumerate(SIZES):
        R = '../'
        other = SIZES[1 - i]
        fits = ''.join(f'<li>{x}</li>' for x in z['fits'])
        body = f'''<section class="detail navy">
  {crumbs([('홈', 'index.html'), ('사이즈', 'size.html'), (z['t'], None)], R)}
  {tabs([(q['key'], q['t'], f"size/{q['key']}.html") for q in SIZES] + [('fit', '내 쉐이커로 찾기', 'size.html#fit')], z['key'], R, '사이즈')}
  <div class="dt-grid">
    <div class="dt-vis">{size_svg(z['svg'])}<span class="ai-tag">AI 생성 일러스트</span></div>
    <div class="dt-copy">
      <p class="eyebrow">사이즈</p>
      <h1 class="dt-h"><span class="size-big">{z['letter']}</span> {z['t'].split(' · ')[1]}</h1>
      <p class="dt-sub">{z['d']} · {z['c']}</p>
      <p class="lede">{z['lede']}</p>
      <h2 class="dt-h2">이런 물병에 맞아요</h2>
      <ul class="dt-ul">{fits}</ul>
      <h2 class="dt-h2">끼우는 위치</h2>
      <p>{z['how']}</p>
      <h2 class="dt-h2">안정성</h2>
      <p>{z['stab']}</p>
      <div class="dt-tip"><b>헷갈리면 이렇게 재요</b><span>종이띠로 물병의 가장 굵은 곳을 한 바퀴 감아 길이를 잰 뒤 3.14로 나누면 지름이에요.</span></div>
    </div>
  </div>
  <nav class="pn" aria-label="다른 사이즈"><a href="{R}size/{other['key']}.html">{other['t']} 보기 →</a><a href="{R}size.html#fit">쉐이커 이름으로 찾기 →</a></nav>
</section>
{cta_band(R, f"{z['letter']} 사이즈 밴드 + 2겹 포켓 + 카드 6장 · 9,900원")}'''
        page(f'size/{z["key"]}.html', 'size', f'{z["letter"]} 사이즈', f'SETSIGN {z["t"]} 사이즈 — {z["d"]}. {z["lede"]}', body, parent='size')

    # 내향인 테스트 -------------------------------------------------
    R = ''
    t = part('sec-test-teaser.html').replace('<section class="sec orange teaser" id="test-teaser"', '<section class="sec orange teaser ph-first" id="test-teaser"')
    t = t.replace('<h2 class="big" id="teaser-h">', '<h1 class="big" id="teaser-h">').replace('</h2>', '</h1>', 1)
    t = t.replace('<div class="cta"><button class="btn btn-n" type="button" data-quiz>테스트 시작</button></div>',
                  '<p class="friend" id="friend-line" hidden></p><div class="cta"><button class="btn btn-n" type="button" data-quiz>테스트 시작</button></div>')
    info = '''<section class="sec white"><ul class="tiles facts">
<li><div><span class="tl-k">질문</span><b>300개 중 10개</b><span>매번 다른 질문이 나오고, 한 번 테스트 안에서는 같은 질문이 다시 나오지 않아요.</span></div></li>
<li><div><span class="tl-k">시간</span><b>1분</b><span>헬스장·카페·메신저처럼 일상 속 상황을 골라요.</span></div></li>
<li><div><span class="tl-k">결과</span><b>내향인 %</b><span>결과를 친구에게 공유하면, 친구 화면에 내 점수가 함께 보여요.</span></div></li>
</ul><p class="fine">재미로 보는 테스트예요. 심리 검사가 아니에요.</p></section>'''
    page('test.html', 'test', '내향인 테스트', '나는 내향인 몇 퍼센트? 질문 300개 중 매번 다른 10개, 1분이면 끝나는 SETSIGN 내향인 테스트.', '\n'.join([t, info]), quiz=True)

    # 영상 -----------------------------------------------------------
    R = ''
    vids = ''.join(f'<li>{video_html(v, "")}<a class="more" href="{v["page"]}.html">관련 페이지 보기 →</a></li>' for v in VIDEOS)
    body = '\n'.join([
        page_head('영상', '숏폼 3편으로<br><span>먼저 보기.</span>', '세로 영상이라 휴대폰에서 보기 좋아요. 마지막 장면의 QR코드를 찍으면 이 사이트가 열려요.'),
        f'<section class="sec white"><ul class="vid-grid">{vids}</ul></section>',
        f'<section class="sec navy vid-sec"><div><p class="eyebrow">브랜드 영상</p><h2 class="big">60초<br>소개 영상.</h2><p class="lede">{MAIN_VIDEO["d"]}</p></div>{video_html(MAIN_VIDEO, "")}</section>',
        cta_band(''),
    ])
    page('videos.html', 'videos', '영상', 'SETSIGN 숏폼 영상 3편(사용법, 카드 6장, 사이즈와 주의사항)과 60초 소개 영상.', body)

    # 구매 -----------------------------------------------------------
    R = ''
    price = part('sec-price.html').replace('<p class="eyebrow">가격</p>', '<p class="eyebrow">구매</p>').replace('class="sec orange price"', 'class="sec orange price ph-first"')
    flow = '''<section class="sec white"><p class="eyebrow">주문 방법</p><h2 class="big">계좌이체로<br>4단계.</h2>
<ol class="tiles steps4 flow">
<li><div><span class="st-n">01</span><b>구글로 로그인</b><span>처음이면 약관 동의 한 번으로 가입이 끝나요. 비밀번호는 받지 않아요.</span></div></li>
<li><div><span class="st-n">02</span><b>주문서 작성</b><span>사이즈(S·L), 수량, 받는 분, 입금자명을 적어요. 금액은 서버가 계산해요.</span></div></li>
<li><div><span class="st-n">03</span><b>3일 안에 입금</b><span>주문하면 입금할 계좌와 금액이 바로 안내돼요. 주문 내역에서 언제든 다시 볼 수 있어요.</span></div></li>
<li><div><span class="st-n">04</span><b>입금 확인 후 발송</b><span>판매자가 통장에서 확인하면 ‘결제 완료’로 바뀌고 상품을 준비해요.</span></div></li>
</ol>
<div class="cta"><button class="btn btn-o" type="button" data-buy>주문하기</button><button class="btn btn-ghost" type="button" data-orders>내 주문 내역</button></div></section>'''
    page('shop.html', 'shop', '구매 · 9,900원', 'SETSIGN 가격 9,900원: 실리콘 밴드 + 2겹 카드 포켓 + 문구 카드 6장. 계좌이체로 주문해요.', '\n'.join([price, flow]))

    # FAQ ------------------------------------------------------------
    R = ''
    faq = part('sec-faq.html').replace('class="sec white faq"', 'class="sec white faq ph-first"').replace('<a href="#refund" data-doc="refund">', '<a href="refund.html">')
    faq = faq.replace('<h2 class="big" id="faq-h">', '<h1 class="big" id="faq-h">').replace('물어보기 전에.</h2>', '물어보기 전에.</h1>')
    more = '''<section class="sec navy"><p class="eyebrow">더 자세히</p><ul class="tiles">
<li><a href="size.html"><b>내 쉐이커에 맞을까?</b><span>제품명으로 S·L 사이즈를 찾아 드려요.</span><span class="tl-go" aria-hidden="true">→</span></a></li>
<li><a href="product/pet-bottle.html"><b>생수병은 왜 안 돼요?</b><span>무게와 얇은 벽 때문이에요.</span><span class="tl-go" aria-hidden="true">→</span></a></li>
<li><a href="shop.html"><b>주문은 어떻게?</b><span>계좌이체 4단계로 안내해요.</span><span class="tl-go" aria-hidden="true">→</span></a></li>
</ul></section>'''
    page('faq.html', 'faq', '자주 묻는 질문', 'SETSIGN 자주 묻는 질문: 맞는 물병, 카드 바꾸는 법, 결제, 배송과 교환·환불.', '\n'.join([faq, more]))

    # 문의 -----------------------------------------------------------
    R = ''
    contact = part('sec-contact.html').replace('class="sec navy contact"', 'class="sec navy contact ph-first"')
    contact = contact.replace('<h2 id="contact-h">', '<h1 class="contact-h" id="contact-h">').replace('</span></h2>', '</span></h1>')
    qr = f'''<section class="sec white qr-sec">
  <div class="qr-box"><img src="assets/qr-setsign.svg" width="320" height="320" alt="SETSIGN 사이트로 이동하는 QR코드 ({SITE_URL})"></div>
  <div>
    <p class="eyebrow">QR코드</p>
    <h2 class="big">찍으면<br>바로 열려요.</h2>
    <p class="lede">휴대폰 카메라로 비추면 <b>{SITE_URL.replace('https://', '')}</b>가 열려요. 주소를 그대로 담은 정적 QR이라 만료되지 않고, 무료로 계속 쓸 수 있어요.</p>
    <div class="cta"><a class="btn btn-n" href="assets/qr-setsign.png" download>PNG 받기 (발표·슬라이드용)</a><a class="btn btn-ghost" href="assets/qr-setsign.svg" download>SVG 받기 (인쇄용)</a></div>
    <p class="fine">흰 배경에 화면의 1/5 이상 크기로 넣어야 멀리서도 잘 인식돼요. 사이트 주소가 바뀌면 QR도 다시 만들어야 해요.</p>
  </div>
</section>'''
    page('contact.html', 'contact', '문의 · QR코드', 'SETSIGN 문의 이메일과 사이트로 바로 이동하는 QR코드.', '\n'.join([contact, qr]))

    # 약관 페이지 -----------------------------------------------------
    tpl = part('doc-templates.html')
    for key, fname in [('terms', 'terms.html'), ('privacy', 'privacy.html'), ('refund', 'refund.html')]:
        m = re.search(r'<template id="t-%s" data-title="([^"]+)">(.*?)</template>' % key, tpl, re.S)
        title, inner = m.group(1), m.group(2)
        body = f'<section class="sec white legal-page ph-first"><p class="eyebrow">SETSIGN</p><h1 class="big">{title}</h1><div class="legal-body">{inner}</div></section>'
        page(fname, '', title, f'SETSIGN {title}', body)

    # 404 -------------------------------------------------------------
    body = '<section class="sec navy ph-first nf"><p class="eyebrow">404</p><h1 class="big">페이지를<br><span>찾을 수 없어요.</span></h1><p class="lede">주소가 바뀌었거나 없는 페이지예요. 위 메뉴에서 바로 이동할 수 있어요.</p><div class="cta"><a class="btn btn-o" href="/index.html">홈으로</a></div></section>'
    page('404.html', '', '페이지를 찾을 수 없어요', 'SETSIGN', body)
    f404 = ROOT / '404.html'; f404.write_text(f404.read_text(encoding='utf-8').replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">', 1), encoding='utf-8')

    (ROOT / 'tools' / 'pages.json').write_text(json.dumps(PAGES, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(PAGES), 'pages')

build()
