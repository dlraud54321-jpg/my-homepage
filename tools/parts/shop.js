/*
  서버(/api/*)가 있으면 실서버 모드, 없으면(파일로 열기, GitHub Pages 등) 데모 모드로 동작해요.
  - 결제는 서버에 설정된 계좌로 직접 이체(무통장 입금)만 받아요. 계좌번호는 이 파일에 없고 서버가 주문 때 내려줘요.
  - 결제 금액은 서버가 주문 수량으로 계산하고, 판매자가 /admin.html 에서 입금을 확인하면 주문이 확정돼요.
*/
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const won = n => Number(n).toLocaleString('ko-KR') + '원';
const UNIT = 9900;
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;
const STATUS = { WAITING_DEPOSIT:['입금 대기','ready'], EXPIRED:['입금 기한 지남','failed'], READY:['결제 대기','ready'], DONE:['결제 완료','done'], FAILED:['결제 실패','failed'], CANCELED:['취소됨','failed'] };

class ApiError extends Error { constructor(m, code) { super(m); this.code = code; } }
async function req(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, { method, credentials:'same-origin', cache:'no-store',
    headers: body ? { 'Content-Type':'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let data = {}; try { data = await r.json(); } catch {}
  if (!r.ok) throw new ApiError(data.message || `요청을 처리하지 못했어요 (${r.status})`, data.code);
  return data;
}
const ADDON = 3900; // 화면 표시용 임시 가격. 실제 금액은 서버가 계산합니다.
const orderName = (S, L, C) => `SETSIGN (${[S && `밴드 S ${S}개`, L && `밴드 L ${L}개`, C && `카드 추가 팩 ${C}개`].filter(Boolean).join(', ')})`;

/* ----- 실서버 ----- */
const Live = {
  mode:'live', cfg:null,
  async init() {
    const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 8000);
    const r = await fetch('/api/health', { signal: ac.signal, cache:'no-store' }); clearTimeout(tm);
    const j = await r.json(); if (!r.ok || j.service !== 'setsign') throw 0;
    this.cfg = await req('/api/config');
  },
  me: () => req('/api/me'),
  google: b => req('/api/auth/google', { method:'POST', body:b }),
  logout: () => req('/api/auth/logout', { method:'POST', body:{} }),
  createOrder: b => req('/api/orders', { method:'POST', body:b }),
  orders: () => req('/api/orders'),
  cancelOrder: b => req('/api/orders/cancel', { method:'POST', body:b }),
  fit: b => req('/api/fit', { method:'POST', body:b }),
};

/* ----- 데모 (이 브라우저에만 저장) ----- */
const Demo = (() => {
  const KEY = 'setsign-demo-v1'; let mem = null;
  const empty = () => ({ users:{}, session:null, orders:[] });
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || empty(); } catch { return mem || (mem = empty()); } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { mem = s; } };
  const wait = (ms = 350) => new Promise(r => setTimeout(r, ms));
  const pub = u => u && { email: u.email, name: u.name };
  return {
    mode:'demo', cfg:{ shippingFee:0, unitPrice:UNIT, addonPrice:ADDON, sizes:{ S:[75,90], L:[90,105] } },
    async me() { const s = load(); return { user: s.session ? pub(s.users[s.session]) : null }; },
    async google(b) {   // 데모: 구글 대신 이 브라우저 안의 데모 계정으로 로그인해요
      await wait(); const s = load(); const email = 'demo@example.com'; let u = s.users[email];
      if (!u) {
        if (!b.agreeAge || !b.agreeTerms || !b.agreePrivacy) return { needAgree:true, email };
        u = s.users[email] = { email, name:'데모 회원', marketing: !!b.agreeMarketing };
      }
      s.session = email; save(s); return { user: pub(u) };
    },
    async logout() { const s = load(); s.session = null; save(s); return { ok:true }; },
    async createOrder({ items, shipping, depositor }) {
      await wait(); const s = load(); if (!s.session) throw new ApiError('로그인이 필요해요.', 'AUTH');
      const n = v => Math.max(0, Math.min(10, v | 0)), S = n(items.S), L = n(items.L), C = n(items.cards);
      if (S + L + C < 1) throw new ApiError('수량을 1개 이상 골라 주세요.');
      if (!(depositor || '').trim()) throw new ApiError('입금자명을 입력해 주세요.');
      const o = { orderId: 'DEMO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase(),
        orderName: orderName(S, L, C), amount: (S + L) * UNIT + C * ADDON + this.cfg.shippingFee, items:{ S, L, cards:C }, shipping,
        payMethod: 'DEPOSIT', status: 'WAITING_DEPOSIT', createdAt: new Date().toISOString(), email: s.session, name: shipping.name,
        depositor: depositor.trim(), depositDue: new Date(Date.now() + 3 * 864e5).toISOString(),
        bank:{ bank:'[은행명]', account:'[계좌번호]', holder:'[예금주]' } };   // 데모용 자리표시. 실제 계좌는 서버 환경 변수에서 내려와요
      s.orders.push(o); save(s); return o;
    },
    async fit() { await wait(200); throw new ApiError('물병 검색은 서버에 연결됐을 때만 동작해요. 아래에서 둘레를 재서 바로 계산할 수 있어요.', 'FIT_OFF'); },
    async orders() { const s = load(); return { orders: s.orders.filter(o => o.email === s.session).reverse() }; },
    async cancelOrder({ orderId }) {
      await wait(); const s = load(); const o = s.orders.find(x => x.orderId === orderId && x.email === s.session);
      if (!o) throw new ApiError('주문을 찾을 수 없어요.');
      if (o.status === 'DONE') throw new ApiError('입금이 확인된 주문은 직접 취소할 수 없어요.');
      Object.assign(o, { status:'CANCELED', canceledAt: new Date().toISOString(), canceledBy:'buyer', cancelReason:'', bank: undefined }); save(s); return o;
    },
  };
})();

/* ----- 화면 ----- */
let B = Demo, user = null, pendingOrder = false, pendingCred = null, lastOrder = null, serverReady = Promise.resolve(false);
const shop = $('#shop'), docDlg = $('#doc');

function view(name) {
  $$('.view', shop).forEach(v => { v.hidden = v.dataset.view !== name; });
  $$('.msg', shop).forEach(m => { m.textContent = ''; });
  if (!shop.open) shop.showModal();
  const v = $(`.view[data-view="${name}"]`, shop);
  requestAnimationFrame(() => (v.querySelector('input:not([type=checkbox])') || v.querySelector('h2')).focus());
}
const say = (form, text) => { $('.msg', form).textContent = text; };
async function busy(btn, fn) {
  const label = btn.textContent; btn.disabled = true; btn.textContent = '처리 중…';
  try { await fn(); } finally { btn.disabled = false; btn.textContent = label; }
}
async function refreshMe() {
  try { user = (await B.me()).user; } catch { user = null; }
  $('#btn-account').textContent = user ? '내 주문' : '로그인';
}
function result(title, body) { $('#res-title').textContent = title; $('#res-body').textContent = body; view('result'); }
function afterAuth() { if (pendingOrder) { pendingOrder = false; openOrder(); } else openOrders(); }

// 닫기, 화면 이동
$$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
[shop, docDlg].forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { const v = go.dataset.go; v === 'orders' ? openOrders() : v === 'order' ? openOrder() : view(v); return; }
  const buy = e.target.closest('[data-buy]');
  if (buy) { e.preventDefault(); startOrder(); return; }
  const d = e.target.closest('[data-doc]');
  if (d) { e.preventDefault(); openDoc(d.dataset.doc); }
});
$('#btn-account').addEventListener('click', () => user ? openOrders() : (pendingOrder = false, openLogin(false)));

function openDoc(key) {
  const t = $('#t-' + key); if (!t) return;
  $('#doc-title').textContent = t.dataset.title;
  const body = $('#doc-body'); body.replaceChildren(t.content.cloneNode(true));
  docDlg.showModal();
}

// 로그인: 구글 로그인 하나로 가입과 로그인을 함께 해요
let gsiLoad = null, gsiInit = false;
const loadGsi = () => gsiLoad || (gsiLoad = new Promise((ok, no) => {
  const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
  sc.onload = ok; sc.onerror = () => { gsiLoad = null; no(new Error('gsi')); }; document.head.append(sc);
}));
function openLogin(needLogin) {
  $('[data-need-login]').hidden = !needLogin; view('login');
  requestAnimationFrame(renderLogin);
}
async function renderLogin() {
  const box = $('#gsi-btn'), msg = $('#login-msg'), demoBtn = $('#btn-demo-login');
  demoBtn.hidden = B.mode !== 'demo'; box.hidden = B.mode === 'demo';
  if (B.mode === 'demo') return;
  if (!B.cfg) {   // 무료 서버가 잠들어 있으면 깨어나는 데 1분쯤 걸려요
    msg.textContent = '서버를 깨우는 중이에요. 최대 1분쯤 걸려요…'; box.hidden = true;
    const ok = await serverReady;
    if (!ok) { msg.textContent = '서버에 연결하지 못했어요. 잠시 뒤에 새로고침해 주세요.'; return; }
    if ($('#gsi-btn') !== box || box.closest('.view').hidden) return;
    msg.textContent = ''; box.hidden = false;
  }
  const id = B.cfg?.googleClientId;
  if (!id) { box.hidden = true; msg.textContent = '구글 로그인이 아직 설정되지 않았어요. 잠시 뒤에 다시 시도해 주세요.'; return; }
  try { await loadGsi(); } catch { msg.textContent = '구글 로그인을 불러오지 못했어요. 광고 차단 기능을 끄거나 새로고침해 주세요.'; return; }
  if (!gsiInit) { google.accounts.id.initialize({ client_id: id, callback: onGoogle, ux_mode: 'popup', context: 'signin', itp_support: true }); gsiInit = true; }
  const w = Math.max(220, Math.min(400, Math.round(box.getBoundingClientRect().width) || 320));
  box.replaceChildren();
  google.accounts.id.renderButton(box, { type:'standard', theme:'outline', size:'large', text:'continue_with', shape:'rectangular', logo_alignment:'center', locale:'ko', width: w });
}
async function signIn(body, onErr) {
  const r = await B.google(body);
  if (r.needAgree) { pendingCred = body.credential; $('#agree-email').textContent = r.email || ''; $('#f-agree').reset(); view('agree'); return; }
  pendingCred = null; user = r.user; await refreshMe(); afterAuth();
}
async function onGoogle({ credential }) {
  const msg = $('#login-msg'); msg.textContent = '확인하고 있어요…';
  try { await signIn({ credential }); } catch (err) { msg.textContent = err.message; }
}
$('#btn-demo-login').addEventListener('click', e => busy(e.currentTarget, async () => {
  try { await signIn({ credential:'demo' }); } catch (err) { $('#login-msg').textContent = err.message; }
}));

// 처음 가입: 약관 동의
const agreeAll = $('#agree-all'), agreeBoxes = $$('#f-agree .agree input:not(#agree-all)');
agreeAll.addEventListener('change', () => agreeBoxes.forEach(c => { c.checked = agreeAll.checked; }));
agreeBoxes.forEach(c => c.addEventListener('change', () => { agreeAll.checked = agreeBoxes.every(x => x.checked); }));
$('#f-agree').addEventListener('change', () => say($('#f-agree'), ''));
$('#f-agree').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.currentTarget;
  if (!pendingCred) { openLogin(pendingOrder); return; }
  if (!f.agreeAge.checked) return say(f, '만 14세 이상만 가입할 수 있어요.');
  if (!f.agreeTerms.checked || !f.agreePrivacy.checked) return say(f, '필수 약관에 동의해 주세요.');
  await busy(f.querySelector('[type=submit]'), async () => {
    try { await signIn({ credential: pendingCred, agreeAge:true, agreeTerms:true, agreePrivacy:true, agreeMarketing: f.agreeMarketing.checked }); }
    catch (err) {
      if (err.code === 'TOKEN_EXPIRED' || err.code === 'BAD_TOKEN') { pendingCred = null; openLogin(pendingOrder); $('#login-msg').textContent = err.message; return; }
      say(f, err.message);
    }
  });
});

// 주문서
const qty = { S:1, L:0, cards:0 };
function renderSum() {
  $$('#f-order .qty').forEach(q => { q.querySelector('output').textContent = qty[q.dataset.size]; });
  const total = qty.S + qty.L + qty.cards;
  const goods = (qty.S + qty.L) * Number(B.cfg?.unitPrice || UNIT) + qty.cards * Number(B.cfg?.addonPrice || ADDON), ship = total ? Number(B.cfg?.shippingFee || 0) : 0;
  $('#sum-goods').textContent = won(goods); $('#sum-ship').textContent = won(ship); $('#sum-total').textContent = won(goods + ship);
}
$$('#f-order .qty button').forEach(b => b.addEventListener('click', () => {
  const k = b.closest('.qty').dataset.size; qty[k] = Math.max(0, Math.min(10, qty[k] + Number(b.dataset.d))); renderSum();
}));
function startOrder() {
  if (!user) { pendingOrder = true; openLogin(true); return; }
  openOrder();
}
function openOrder() {
  if (!user) return startOrder();
  const f = $('#f-order'); if (!f.name.value && user.name) f.name.value = user.name;
  if (!f.depositor.value && user.name) f.depositor.value = user.name;
  renderSum(); view('order');
  if (B.mode === 'live' && !B.cfg?.bankEnabled) say(f, '지금은 주문을 받을 수 없어요. 판매자가 입금 계좌를 준비 중이에요.');
}
function showDeposit(o) {
  $('#dp-bank').textContent = o.bank?.bank || ''; $('#dp-acct').textContent = o.bank?.account || ''; $('#dp-holder').textContent = o.bank?.holder || '';
  $('#dp-amt').textContent = won(o.amount); $('#dp-name').textContent = o.depositor || '';
  $('#dp-due').textContent = o.depositDue ? new Date(o.depositDue).toLocaleDateString('ko-KR') + '까지' : '';
  view('deposit');
}
$('#btn-copy-acct').addEventListener('click', async () => {
  const box = $('[data-view="deposit"]', shop), t = $('#dp-acct').textContent;
  try { await navigator.clipboard.writeText(t); say(box, '계좌번호를 복사했어요.'); } catch { say(box, '복사하지 못했어요. 계좌번호를 길게 눌러 복사해 주세요.'); }
});
$('#f-order').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.currentTarget, d = Object.fromEntries(new FormData(f));
  if (qty.S + qty.L + qty.cards < 1) return say(f, '수량을 1개 이상 골라 주세요.');
  const depositor = (d.depositor || '').trim();
  if (!depositor) return say(f, '입금자명을 입력해 주세요.');
  if (!(d.name || '').trim()) return say(f, '받는 분 이름을 입력해 주세요.');
  if (!PHONE_RE.test((d.phone || '').trim())) return say(f, '휴대폰 번호를 확인해 주세요. 예: 010-1234-5678');
  if (!/^\d{5}$/.test((d.zip || '').trim())) return say(f, '우편번호 5자리를 입력해 주세요.');
  if (!(d.addr1 || '').trim()) return say(f, '주소를 입력해 주세요.');
  if (!f.agree.checked) return say(f, '주문 내용 확인에 동의해 주세요.');
  const shipping = { name: d.name.trim(), phone: d.phone.trim(), zip: d.zip.trim(), addr1: d.addr1.trim(), addr2: (d.addr2 || '').trim(), memo: (d.memo || '').trim() };
  await busy(f.querySelector('[type=submit]'), async () => {
    try {
      lastOrder = await B.createOrder({ items:{ S: qty.S, L: qty.L, cards: qty.cards }, shipping, depositor });
      showDeposit(lastOrder);
    } catch (err) {
      say(f, err.message);
      if (err.code === 'AUTH') { user = null; await refreshMe(); }
    }
  });
});
// 주문 내역 · 주문 상세: 판매자가 입금 확인이나 취소를 하면 상태에 맞는 화면이 보여요
const fmt = d => d ? new Date(d).toLocaleString('ko-KR', { year:'numeric', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
const fmtDay = d => d ? new Date(d).toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'short' }) : '';
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
let myOrders = [];
function statusLine(o) {
  if (o.status === 'WAITING_DEPOSIT') return `${fmtDay(o.depositDue)}까지 입금해 주세요`;
  if (o.status === 'DONE') return '입금 확인 완료 · 배송 준비 중';
  if (o.status === 'EXPIRED') return '입금 기한이 지나 주문이 멈췄어요';
  if (o.status === 'CANCELED') return (o.canceledBy === 'buyer' ? '직접 취소한 주문이에요' : '판매자가 취소했어요') + (o.cancelReason ? ` · 사유: ${o.cancelReason}` : '');
  return '';
}
async function openOrders() {
  if (!user) { pendingOrder = false; openLogin(false); return; }
  view('orders'); $('#me-line').textContent = `${user.name || ''} · ${user.email}`;
  const list = $('#order-list'); list.replaceChildren(mk('li', 'msg-li', '불러오는 중…'));
  try {
    myOrders = (await B.orders()).orders || []; list.replaceChildren();
    if (!myOrders.length) { list.append(mk('li', 'msg-li', '아직 주문이 없어요.')); return; }
    for (const o of myOrders) {
      const [label, cls] = STATUS[o.status] || [o.status, 'ready'];
      const row = mk('button', 'od-row' + (o.status === 'CANCELED' ? ' off' : '')); row.type = 'button';
      row.append(mk('b', '', o.orderName), mk('span', 'badge ' + cls, label),
        mk('span', 'oid', `${fmt(o.createdAt)} · 주문번호 ${o.orderId}`), mk('span', 'amt', won(o.amount)), mk('span', 'st', statusLine(o)));
      row.addEventListener('click', () => openDetail(o.orderId));
      const li = mk('li'); li.append(row); list.append(li);
    }
  } catch (err) { list.replaceChildren(mk('li', 'msg-li', err.message)); }
}
function openDetail(id) {
  const o = myOrders.find(x => x.orderId === id); if (!o) return openOrders();
  const [label, cls] = STATUS[o.status] || [o.status, 'ready'];
  $('#od-chip').replaceChildren(mk('span', 'badge ' + cls, label));
  const T = {
    WAITING_DEPOSIT: ['입금을 기다리고 있어요', `${fmtDay(o.depositDue)}까지 아래 계좌로 입금자명 그대로 입금해 주세요. 판매자가 통장에서 확인하면 ‘결제 완료’로 바뀌어요.`],
    DONE: ['결제가 확인됐어요', `${fmt(o.approvedAt)}에 입금이 확인됐어요. 상품을 준비해서 보내 드릴게요.`],
    EXPIRED: ['입금 기한이 지났어요', '기한 안에 입금이 확인되지 않아 주문이 멈췄어요. 필요하면 다시 주문해 주세요.'],
    CANCELED: ['주문이 취소됐어요', `${fmt(o.canceledAt)}에 ${o.canceledBy === 'buyer' ? '직접 취소했어요.' : '판매자가 주문을 취소했어요.'}`],
  }[o.status] || [label, ''];
  $('#od-title').textContent = T[0]; $('#od-desc').textContent = T[1];
  // 진행 단계
  const steps = $('#od-steps'); steps.replaceChildren();
  const step = (name, state, sub) => { const li = mk('li', state, name); if (sub) li.append(mk('small', '', sub)); if (state === 'now') li.setAttribute('aria-current', 'step'); steps.append(li); };
  step('주문 접수', 'done', fmtDay(o.createdAt));
  if (o.status === 'WAITING_DEPOSIT') { step('입금 확인', 'now', '확인 대기 중'); step('배송 준비', '', ''); }
  else if (o.status === 'DONE') { step('입금 확인', 'done', fmtDay(o.approvedAt)); step('배송 준비', 'now', '준비 중'); }
  else if (o.status === 'CANCELED') { step('주문 취소', 'stop', fmtDay(o.canceledAt)); step('배송 준비', '', ''); }
  else { step('입금 기한 지남', 'stop', fmtDay(o.depositDue)); step('배송 준비', '', ''); }
  // 상태별 안내
  const extra = $('#od-extra'); extra.replaceChildren();
  if (o.status === 'WAITING_DEPOSIT' && o.bank) {
    const box = mk('div', 'bankbox');
    const line = (k, v, c) => { const d = mk('div', c || ''); d.append(mk('span', '', k), mk('b', '', v)); box.append(d); };
    line('은행', o.bank.bank); line('계좌번호', o.bank.account, 'acct'); line('예금주', o.bank.holder);
    line('입금액', won(o.amount)); line('입금자명', o.depositor || ''); line('입금 기한', fmtDay(o.depositDue) + '까지');
    extra.append(box);
  }
  if (o.status === 'CANCELED') {
    const n = mk('div', 'od-note');
    n.append(mk('b', '', o.canceledBy === 'buyer' ? '직접 취소한 주문이에요' : '판매자가 취소한 주문이에요'));
    if (o.cancelReason) n.append(mk('span', '', `사유: ${o.cancelReason}`), mk('br'));
    n.append(mk('span', '', '이미 입금하셨다면 주문번호와 함께 문의해 주세요. 확인 후 환불해 드려요.'));
    extra.append(n);
  }
  if (o.status === 'EXPIRED') { const n = mk('div', 'od-note'); n.append(mk('b', '', '이미 입금하셨나요?'), mk('span', '', '판매자가 통장을 확인하면 ‘결제 완료’로 바뀌어요. 늦어지면 주문번호와 함께 문의해 주세요.')); extra.append(n); }
  // 주문 정보
  const info = $('#od-info'); info.replaceChildren();
  const sh = o.shipping || {};
  const row = (k, v) => { if (!v) return; info.append(mk('dt', '', k), mk('dd', '', v)); };
  row('주문번호', o.orderId); row('주문 일시', fmt(o.createdAt)); row('상품', o.orderName); row('결제 금액', won(o.amount) + ' (계좌이체)');
  row('입금자명', o.depositor); row('받는 분', sh.name); row('연락처', sh.phone);
  row('배송지', sh.addr1 ? `(${sh.zip}) ${sh.addr1} ${sh.addr2 || ''}`.trim() : ''); row('배송 메모', sh.memo);
  // 버튼
  $('#od-msg').textContent = '';
  const acts = $('#od-acts'); acts.replaceChildren(); acts.nextElementSibling?.classList.contains('od-confirm') && acts.nextElementSibling.remove();
  const btn = (text, cls, fn) => { const b = mk('button', 'btn ' + cls, text); b.type = 'button'; b.addEventListener('click', fn); acts.append(b); return b; };
  if (o.status === 'WAITING_DEPOSIT') btn('계좌번호 복사', 'btn-o', async () => { try { await navigator.clipboard.writeText(o.bank?.account || ''); $('#od-msg').textContent = '계좌번호를 복사했어요.'; } catch { $('#od-msg').textContent = '복사하지 못했어요. 계좌번호를 길게 눌러 복사해 주세요.'; } });
  if (o.status === 'EXPIRED' || o.status === 'CANCELED') { const b = btn('다시 주문하기', 'btn-o', () => {}); b.dataset.buy = ''; }
  if (o.status === 'WAITING_DEPOSIT' || o.status === 'EXPIRED') btn('주문 취소하기', 'btn-ghost', () => askCancel(o));
  if (o.status === 'CANCELED' || o.status === 'EXPIRED' || o.status === 'DONE') btn('문의하기', 'btn-ghost', () => { shop.close(); location.hash = '#contact'; });
  view('detail');
}
function askCancel(o) {
  const acts = $('#od-acts'); if (acts.nextElementSibling?.classList.contains('od-confirm')) return acts.nextElementSibling.querySelector('button').focus();
  const box = mk('div', 'od-confirm');
  box.append(mk('p', '', '이 주문을 취소할까요? 취소하면 되돌릴 수 없어요.'));
  const r = mk('div', 'btn-row'); r.style.marginTop = '0';
  const no = mk('button', 'btn btn-ghost', '아니요'); no.type = 'button'; no.addEventListener('click', () => box.remove());
  const yes = mk('button', 'btn btn-n', '네, 취소할게요'); yes.type = 'button';
  yes.addEventListener('click', () => busy(yes, async () => {
    try {
      const u = await B.cancelOrder({ orderId: o.orderId });
      myOrders = myOrders.map(x => x.orderId === o.orderId ? { ...x, ...u } : x); openDetail(o.orderId);
    } catch (err) { $('#od-msg').textContent = err.message; }
  }));
  r.append(yes, no); box.append(r); acts.after(box); yes.focus();
}
$('#btn-logout').addEventListener('click', async () => { try { await B.logout(); } catch {} try { window.google?.accounts.id.disableAutoSelect(); } catch {} user = null; await refreshMe(); shop.close(); });

/* ----- 내 물병 사이즈 찾기 ----- */
const fitOut = $('#fit-out');
function recommend(mm) {                       // 서버와 같은 기준 (cfg.sizes, 단위 mm)
  const z = B.cfg?.sizes || { S:[75,90], L:[90,105] };
  if (mm < z.S[0]) return { size:null, text:'S보다 가는 물병이에요. 밴드가 헐거울 수 있어요' };
  if (mm > z.L[1]) return { size:null, text:'L보다 굵은 물병이에요. 지금 사이즈로는 맞지 않아요' };
  const size = mm <= z.S[1] ? 'S' : 'L', edge = Math.abs(mm - z.S[1]) <= 2;
  return { size, text: size + ' 사이즈를 추천해요' + (edge ? '. S와 L의 경계라 둘레를 한 번 재 보면 더 정확해요' : '') };
}
function showFit({ product, mm, basis, sourceUrl, note, manual }) {
  const r = recommend(mm); fitOut.className = 'fit-out'; fitOut.replaceChildren();
  const rec = Object.assign(document.createElement('p'), { className:'rec' });
  rec.append(Object.assign(document.createElement('b'), { textContent: r.size || '–' }), Object.assign(document.createElement('span'), { textContent: r.text }));
  fitOut.append(rec, Object.assign(document.createElement('p'), { textContent: `${product} · 몸통 지름 약 ${(mm / 10).toFixed(1)}cm` + (basis === 'estimate' ? ' (추정값)' : basis === 'circumference' ? ' (둘레로 계산)' : '') }));
  if (note) fitOut.append(Object.assign(document.createElement('p'), { textContent: note }));
  if (sourceUrl) { const p = document.createElement('p'), a = Object.assign(document.createElement('a'), { href: sourceUrl, target:'_blank', rel:'noopener noreferrer', textContent: new URL(sourceUrl).hostname }); p.append('규격 출처: ', a); fitOut.append(p); }
  fitOut.append(Object.assign(document.createElement('p'), { textContent: manual ? '직접 잰 둘레로 계산한 추천이에요.' : '인터넷에서 찾은 규격으로 계산한 추천이에요. 제품이 리뉴얼되면 달라질 수 있으니, 애매하면 둘레를 재 보세요.' }));
  fitOut.append(Object.assign(document.createElement('p'), { className:'caution', textContent:'일회용 플라스틱 생수병이라면 사이즈가 맞아도 권장하지 않아요. 물이 줄어들수록 밴드를 유지하기 어렵고 물병이 쓰러질 수 있어요.' }));
  if (r.size) { const b = Object.assign(document.createElement('button'), { className:'btn btn-n', type:'button', textContent: r.size + ' 사이즈로 주문하기' });
    b.addEventListener('click', () => { qty.S = r.size === 'S' ? 1 : 0; qty.L = r.size === 'L' ? 1 : 0; startOrder(); }); fitOut.append(b); }
}
$('#f-fit').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.currentTarget, q = f.q.value.trim();
  if (q.length < 2) { fitOut.className = 'fit-out wait'; fitOut.textContent = '물병 이름을 두 글자 이상 적어 주세요.'; return; }
  fitOut.className = 'fit-out wait'; fitOut.textContent = `“${q}” 규격을 인터넷에서 찾는 중이에요. 10~30초쯤 걸려요.`;
  await busy(f.querySelector('[type=submit]'), async () => {
    try {
      const r = await B.fit({ query: q });
      if (!r.found) { fitOut.textContent = (r.note || '이 제품의 지름을 찾지 못했어요.') + ' 아래에서 둘레를 재서 계산해 보세요.'; $('#fit-manual').open = true; return; }
      showFit({ product: r.product, mm: r.diameterMm, basis: r.basis, sourceUrl: r.sourceUrl, note: r.note });
    } catch (err) { fitOut.textContent = err.message; $('#fit-manual').open = true; }
  });
});
$('#f-fit-manual').addEventListener('submit', e => {
  e.preventDefault(); const c = parseFloat(String(e.currentTarget.c.value).replace(',', '.'));
  if (!(c >= 10 && c <= 45)) { fitOut.className = 'fit-out wait'; fitOut.textContent = '둘레를 cm로 적어 주세요. 쉐이커는 보통 24~33cm 사이예요.'; return; }
  showFit({ product:'직접 잰 물병', mm: Math.round(c * 10 / Math.PI), basis:'circumference', manual:true });
});
// 말로 입력 (지원하는 브라우저에서만 버튼이 보여요)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $('#fit-mic');
if (SR) {
  mic.hidden = false; let rec = null;
  mic.addEventListener('click', () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'ko-KR'; rec.interimResults = false; rec.maxAlternatives = 1;
    mic.setAttribute('aria-pressed', 'true'); fitOut.className = 'fit-out wait'; fitOut.textContent = '듣고 있어요. 물병 이름을 말해 주세요.';
    rec.onresult = ev => { $('#fit-q').value = ev.results[0][0].transcript.slice(0, 60); fitOut.textContent = ''; $('#f-fit').requestSubmit(); };
    rec.onerror = () => { fitOut.textContent = '잘 듣지 못했어요. 글자로 적어 주세요.'; };
    rec.onend = () => { mic.setAttribute('aria-pressed', 'false'); rec = null; };
    try { rec.start(); } catch { rec = null; mic.setAttribute('aria-pressed', 'false'); }
  });
}

/* ----- 시작: 파일로 열거나 GitHub Pages면 데모, 그 밖(서버 주소)은 항상 실서버 ----- */
// 무료 서버가 잠들어 있어도 데모로 넘어가지 않고, 깨어날 때까지 기다려요.
const STATIC_HOST = location.protocol === 'file:' || /(^|\.)github\.io$/.test(location.hostname);
if (STATIC_HOST) {
  B = Demo; serverReady = Promise.resolve(false);
  if (location.hostname.endsWith('github.io')) $$('.demo-banner', shop).forEach(el => {
    el.append(' 실제 주문은 ');
    const a = document.createElement('a'); a.href = 'https://setsign.onrender.com'; a.textContent = 'setsign.onrender.com'; a.style.color = 'inherit';
    el.append(a, '에서 할 수 있어요.');
  });
} else {
  B = Live;
  serverReady = (async () => {
    for (let i = 0; i < 12; i++) { try { await Live.init(); return true; } catch { await new Promise(r => setTimeout(r, 3000)); } }
    return false;
  })();
}
$$('.demo-banner', shop).forEach(el => { el.hidden = B.mode !== 'demo'; });
// 약관 바로가기: /privacy, /terms, /refund 주소나 #privacy 같은 링크로 들어오면 해당 문서를 열어요
const docFromUrl = () => { const k = (location.pathname.match(/\/(privacy|terms|refund)\/?$/) || location.hash.match(/^#(privacy|terms|refund)$/) || [])[1]; if (k) openDoc(k); };
docFromUrl(); addEventListener('hashchange', docFromUrl);
if (B.mode === 'live') await serverReady;
await refreshMe();
