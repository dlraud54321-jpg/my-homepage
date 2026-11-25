window.SETSIGN_CARDS = [
  {key:'together', n:'01', t:'같이 써요',  s:'교대로 쓰셔도 돼요',     bg:'orange', fg:'navy',   ac:'navy'},
  {key:'set',      n:'02', t:'세트 중',    s:'지금 운동 중이에요',     bg:'navy',   fg:'white',  ac:'orange'},
  {key:'left2',    n:'03', t:'2세트 남음', s:'조금만 기다려 주세요',   bg:'white',  fg:'navy',   ac:'orange'},
  {key:'last',     n:'04', t:'마지막 세트', s:'곧 자리 비워요',         bg:'orange', fg:'navy',   ac:'white'},
  {key:'away',     n:'05', t:'잠깐 비움',  s:'물 마시고 올게요',       bg:'navy',   fg:'orange', ac:'white'},
  {key:'spot',     n:'06', t:'스팟 가능',  s:'보조 필요하면 불러 주세요', bg:'white', fg:'navy',   ac:'navy'}
];
(function(){
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  var track = document.querySelector('.how-track');
  var steps = [].slice.call(document.querySelectorAll('.step'));
  var bars = [].slice.call(document.querySelectorAll('.how-bar i'));
  var cur = -1;
  function upd(){
    if (!track) return;
    var r = track.getBoundingClientRect();
    var P = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    var i = P < .24 ? 0 : P < .5 ? 1 : P < .74 ? 2 : 3;
    if (i === cur) return; cur = i;
    steps.forEach(function(s,k){ s.classList.toggle('is-on', k === i); });
    bars.forEach(function(b,k){ b.classList.toggle('on', k <= i); });
  }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 카드 갤러리: 세로 스크롤 → 가로 이동, 가운데 온 카드를 3D 물병에 꽂기
  var cgT = document.querySelector('.cg-track'), rail = document.querySelector('.cg-rail');
  var items = rail ? [].slice.call(rail.children) : [], cgN = document.getElementById('cg-n'), ci = 0;
  function gal(){
    if (!cgT || !rail) return;
    var r = cgT.getBoundingClientRect();
    var P = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    var pos = P * (items.length - 1), fl = Math.floor(pos), f = pos - fl;
    pos = fl + f * f * (3 - 2 * f);                       // 카드마다 살짝 멈칫하게
    rail.style.transform = 'translate3d(' + (-pos * (items[1].offsetLeft - items[0].offsetLeft)) + 'px,0,0)';
    var i = Math.round(pos); if (i === ci) return; ci = i;
    items.forEach(function(li,k){ li.classList.toggle('on', k === i); });
    cgN.textContent = '0' + (i + 1);
    document.dispatchEvent(new CustomEvent('ss:card', { detail: items[i].dataset.key }));
  }
  // 윤곽선 대형 글자가 스크롤에 따라 미끄러짐
  var drifts = [].slice.call(document.querySelectorAll('[data-drift]'));
  function drift(){
    if (reduce) return;
    drifts.forEach(function(el){
      var r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var d = ((innerHeight - r.top) / (innerHeight + r.height) - .5) * parseFloat(el.dataset.drift);
      el.style.transform = el.dataset.axis === 'y' ? 'translate3d(0,' + d.toFixed(1) + 'px,0)' : 'translate3d(' + d.toFixed(1) + 'px,0,0)';
    });
  }
  var tick = false;
  function onScroll(){ if (tick) return; tick = true; requestAnimationFrame(function(){ tick = false; upd(); gal(); drift(); }); }
  addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll); upd(); gal(); drift();

  // 등장: 제목은 아래에서 밀려 올라오고, 블록은 떠오름. 숫자는 세어 올라감
  [].forEach.call(document.querySelectorAll('.big, .contact h2, .contact-h, .price h2, .price-big, .ph-h'), function(el){ var w = document.createElement('span'); w.className = 'rvi'; while (el.firstChild) w.appendChild(el.firstChild); el.appendChild(w); el.classList.add('rv'); });
  [].forEach.call(document.querySelectorAll('.stat, .size-card, .faq details, .incl li, .ctrl, .chips, .tiles > li, .card-grid > li, .vid-grid > li'), function(el,i){ el.classList.add('up'); el.style.setProperty('--d', (i % 6) * .07 + 's'); });
  function count(el){
    var to = +el.dataset.count, t0 = performance.now();
    if (reduce) return;
    (function f(n){ var p = Math.min(1, (n - t0) / 1400), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e).toLocaleString('ko-KR'); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){
    if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('in');
    [].forEach.call(e.target.querySelectorAll('[data-count]'), count);
  }); }, { threshold: 0, rootMargin: '0px 0px -18% 0px' });
  [].forEach.call(document.querySelectorAll('.rv, .up'), function(el){ io.observe(el); });
  var heroIn = function(){ [].forEach.call(document.querySelectorAll('.hero .rvh'), function(el){ el.classList.add('in'); }); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){ setTimeout(heroIn, 80); });
  setTimeout(heroIn, 1500);

  // 따라다니는 커서
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && document.getElementById('cur')) {
    var cz = document.getElementById('cur'), cx = 0, cy = 0, tx = 0, ty = 0, seen = false;
    addEventListener('pointermove', function(e){
      tx = e.clientX; ty = e.clientY; var t = e.target; if (!t.closest) return;
      if (!seen) { seen = true; cx = tx; cy = ty; }
      var st = t.closest('.stage');
      cz.style.opacity = t.closest('dialog') ? 0 : 1;
      cz.classList.toggle('is-drag', !!st && !(e.buttons & 1));
      cz.classList.toggle('is-link', !st && !!t.closest('a,button,summary,label'));
      cz.classList.toggle('on-o', !!t.closest('.orange,.btn-o,.c-orange,.mq:not(.alt)'));
    }, {passive:true});
    document.addEventListener('pointerleave', function(){ cz.style.opacity = 0; });
    (function loop(){ cx += (tx - cx) * .22; cy += (ty - cy) * .22; cz.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; requestAnimationFrame(loop); })();
  }

  // ── 쉐이커 안정성 계산 (정적 평형, 단위 g·cm). 화면의 숫자와 무게 설계 표가 같은 식을 씁니다 ──
  var SHAKER = { 0:{ max:700, m:130, rb:2.6, rin:4.1, R:4.3, ycg:9.0, yk:8.0, name:'캡슐형 700mL(바닥 지름 약 5cm)' },   // S: 캡슐형, 바닥이 좁음
                 1:{ max:700, m:130, rb:4.2, rin:4.5, R:4.85, ycg:10.0, yk:8.0, name:'기본형 700mL(바닥 지름 8.4cm)' } };  // L: 기본형
  var KIT = { band:18, pocket:16, arc:Math.PI * 2 / 3 };                              // 밴드 18g, 포켓+카드 2장 16g, 패드 120°
  function stability(sz, V, withPad){
    var P = SHAKER[sz], d = P.R + .43, rp = P.R + .33, cm = rp * Math.sin(KIT.arc / 2) / (KIT.arc / 2);
    var mc = withPad ? KIT.pocket * d / cm : 0, h = V / (Math.PI * P.rin * P.rin), yw = .4 + h / 2;
    var M = P.m + KIT.band + KIT.pocket + mc + V;
    var x = (KIT.pocket * d - mc * cm) / M, y = (P.m * P.ycg + (KIT.band + KIT.pocket + mc) * P.yk + V * yw) / M;
    return { x: x * 10, tilt: Math.atan((P.rb - x) / y) * 180 / Math.PI, pad: mc };
  }
  window.SETSIGN_STAB = stability;
  var wr = document.getElementById('water-r'), sz = 0;
  function stab(){
    if (!wr) return;
    var max = SHAKER[sz].max, V = Math.min(+wr.value, max);
    wr.max = max; wr.value = V;
    var a = stability(sz, V, true), b = stability(sz, V, false);
    document.getElementById('water-v').textContent = V + 'mL';
    document.getElementById('stab-x').textContent = Math.abs(a.x).toFixed(1) + 'mm';
    document.getElementById('stab-x2').textContent = '균형 패드가 없으면 ' + b.x.toFixed(1) + 'mm';
    document.getElementById('stab-t').textContent = Math.round(a.tilt) + '°';
    document.getElementById('stab-t2').textContent = '균형 패드가 없으면 ' + Math.round(b.tilt) + '°';
    document.getElementById('stab-basis').textContent = SHAKER[sz].name + ' 기준' + (sz === 0 ? ' · 캡슐형은 바닥이 좁아 기본형보다 덜 버텨요' : '');
    document.dispatchEvent(new CustomEvent('ss:water', { detail: V / 700 }));   // 3D 눈금은 0~700mL
  }
  if (wr) wr.addEventListener('input', stab);
  [].forEach.call(document.querySelectorAll('.seg [data-size], [data-size-go]'), function(b){
    b.addEventListener('click', function(){ sz = +(b.dataset.size || b.dataset.sizeGo); stab(); });
  });
  stab();
  // three.js를 못 불러오면 안내 문구 표시
  if (document.getElementById('gl')) setTimeout(function(){ if(!window.__ss3d) document.documentElement.classList.add('no-gl'); }, 8000);

  // 메뉴: 지금 페이지 메뉴가 화면 안에 보이게 (작은 화면에서 가로로 넘칠 때)
  var curNav = document.querySelector('.hd nav [aria-current]');
  if (curNav && curNav.scrollIntoView) { var nav = curNav.parentElement; nav.scrollLeft = curNav.offsetLeft - nav.clientWidth / 2 + curNav.clientWidth / 2; }

  // 앱 설치 (PWA)
  var root = document.body.dataset.root || '';
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register(root + 'sw.js').catch(function(){});
  var installBtn = document.getElementById('btn-install'), hint = document.getElementById('app-hint'), deferred = null;
  if (installBtn && hint) {
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) hint.textContent = '지금 앱으로 열려 있어요.';
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) hint.textContent = 'iPhone·iPad는 Safari의 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 고르면 앱으로 설치돼요.';
    addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; installBtn.hidden = false; hint.textContent = '홈 화면에 두면 사이즈 찾기와 주문 내역을 바로 열 수 있어요.'; });
    installBtn.addEventListener('click', function(){ if (!deferred) return; deferred.prompt(); deferred.userChoice.then(function(){ deferred = null; installBtn.hidden = true; }); });
    addEventListener('appinstalled', function(){ installBtn.hidden = true; hint.textContent = '설치됐어요. 홈 화면에서 SETSIGN을 열어 보세요.'; });
  }
  // 영상: 하나를 재생하면 다른 영상은 멈춰요
  [].forEach.call(document.querySelectorAll('video'), function(v){ v.addEventListener('play', function(){ [].forEach.call(document.querySelectorAll('video'), function(o){ if (o !== v) o.pause(); }); }); });
})();
