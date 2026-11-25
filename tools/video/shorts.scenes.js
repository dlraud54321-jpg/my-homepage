// 화면 위에 고정되는 글(카메라 줌 영향 없음)
const hud = document.createElement('div'); hud.id = 'hud'; hud.style.cssText = 'position:absolute;inset:0;pointer-events:none'; $('stage').insertBefore(hud, $('wipe'));
function mkh(id, html, css, cls = '', splitIt = false) { const d = mk(id, html, css, cls, splitIt); hud.append(d); return d; }

/* ===== A: POV 내향인 헬스러 (28초) ===== */
if (V === 'a') {
  mkh('a1', 'POV:', 'left:70px;top:310px;font-size:130px;color:var(--o)', 'ant');
  mkh('a2', '쓰고 싶은 기구에<br>누가 앉아 있다', 'left:70px;top:450px;font-size:112px;color:var(--n)', 'bhs', true);
  mk('a3', '<div class="bub">말 걸까…?</div>', 'left:80px;top:770px', '');
  mk('a4', '<div class="bub">바쁘신가…</div>', 'left:380px;top:900px', '');
  mk('a6', '<div class="b9" style="font-size:40px;color:var(--n)">기구 앞에서 서성인 시간</div><div class="ant" id="a7" style="font-size:150px;color:var(--o)">00:00</div>', 'left:84px;top:1040px', '');
  mk('aBench', '<svg width="900" height="230" viewBox="0 0 900 230"><rect x="300" y="40" width="560" height="44" fill="#0E1240"/><rect x="330" y="84" width="22" height="130" fill="#0E1240"/><rect x="810" y="84" width="22" height="130" fill="#0E1240"/><path d="M0 214H900" stroke="#0E1240" stroke-width="8"/></svg>', 'left:90px;top:1300px', '');
  mkh('a8', '근데 저 사람 물병에…', 'left:70px;top:310px;font-size:110px;color:var(--n)', 'bhs', true);
  mkh('a9', '<span style="background:var(--n);color:var(--w);padding:14px 26px">“교대로 쓰셔도 돼요”</span>', 'left:70px;top:1360px;font-size:62px', 'b9');
  mk('aS1', '<div class="step"><b>1</b><span>물병에 끼우고</span></div>', 'left:70px;top:330px', '');
  mk('aS2', '<div class="step"><b>2</b><span>카드를 쓱 빼서</span></div>', 'left:70px;top:470px', '');
  mk('aS3', '<div class="step"><b>3</b><span>바꿔 꽂으면 끝</span></div>', 'left:70px;top:610px', '');
  SC.a = { len: 28, cuts: [[0, W], [9, N], [13, W], [21, O]], wipes: [9, 13, 21], render(t, cam) {
    if (t < 9) {
      A('a1', t, .1, 5.9, 'slam', { d: .35 }); A('a2', t, .3, 5.9, 'chars', { st: .03 });
      A('a3', t, 2.0, 5.9, 'pop', { d: .4 }); A('a4', t, 2.75, 5.9, 'pop', { d: .4 });
      A('a6', t, 3.4, 5.9, 'up');
      const sec = Math.round(E.inOut(prog(t, 3.5, 5.6)) * 462); $('a7').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      $('aBench').style.opacity = 1; $('aBench').style.transform = '';
      placeShaker(800, 1155, .34, 0);
      A('a8', t, 6.0, 8.95, 'chars', { st: .04, xd: .1 });
      // 6.4~7.8: 물병 카드로 확 줌
      const z = E.inOut(prog(t, 6.4, 7.8)), s = lerp(1, 3, z);
      cam.s = s; cam.x = lerp(0, 540 - (540 + (800 - 540) * 3), z); cam.y = lerp(0, 1120 - (900 + (1188 - 900) * 3), z);
      cam.shake(7.85, 16, .3);
      A('a9', t, 7.9, 8.95, 'pop', { d: .35, xd: .1 });
    } else if (t < 13) brand(t, 9, 12.9);
    else if (t < 21) {
      A('aS1', t, 13.15, 20.9, 'left', { d: .4 }); A('aS2', t, 15.65, 20.9, 'left', { d: .4 }); A('aS3', t, 18.15, 20.9, 'left', { d: .4 });
      setT('kit', 0, lerp(-380, 0, E.out(prog(t, 13.4, 14.4))));
      const pull = E.inOut(prog(t, 16.0, 16.8)), back = E.inOut(prog(t, 18.6, 19.5));
      if (t < 18.4) setT('cardA', pull * 250, 0, 1, pull * 6);
      else { cardOrder(back > .5 ? 'B' : 'A'); setT('cardB', 0, E.inOut(prog(t, 18.3, 18.8)) * 8); setT('cardA', lerp(250, 0, back), lerp(0, -8, back), 1, lerp(6, 0, back)); }
      placeShaker(560, 1150, .72 * beatPulse(t, .012), 0);
      cam.s = 1 + Math.sin(t * .9) * .008;
    } else ending(t, 21, 28.5);
  } };
}

/* ===== B: 이 상황엔 어떤 카드? (30초) ===== */
if (V === 'b') {
  mkh('b1', '헬스장에서', 'left:70px;top:330px;font-size:120px', 'bhs', true);
  mkh('b2', '말 한마디 없이', 'left:70px;top:480px;font-size:150px;color:var(--o)', 'bhs', true);
  mkh('b3', '대화하는 법', 'left:70px;top:660px;font-size:150px', 'bhs', true);
  mk('b0', '<div class="bub o" style="font-size:90px;padding:26px 44px">“…같이 쓰실래요?”</div>', 'left:110px;top:1000px', '');
  mk('bX', '<svg width="760" height="200" viewBox="0 0 760 200"><path d="M20 180L740 20" stroke="#F5F5F0" stroke-width="22"/></svg>', 'left:150px;top:990px', '');
  mkh('b5', '상황 01 / 06', 'left:72px;top:320px;font-size:44px;color:var(--o)', 'b9');
  mkh('b6', '<div class="box" id="b6t"></div>', 'left:70px;top:390px', '');
  mkh('b7', '이럴 땐 이 카드', 'left:74px;top:700px;font-size:46px;color:var(--n)', 'b9');
  mkh('b8', '<div class="bigcard" id="b8c"><div class="top"><span>SETSIGN</span><span id="b8n">01</span></div><div><div class="t" id="b8t"></div><div class="s" id="b8s"></div></div></div>', 'left:130px;top:780px', '');
  mkh('b9', '앞 칸에 꽂아 두면 끝', 'left:74px;top:1380px;font-size:50px;color:var(--n)', 'b9');
  const R = [['쉬는 중인데,<br>기구 써도 괜찮을 때', 'together'], ['잠깐 일어났지만<br>아직 쓰는 중일 때', 'set'], ['기다리는 사람이<br>보일 때', 'left2'],
             ['이번 세트만 하면<br>자리 비울 때', 'last'], ['물 마시러<br>잠깐 다녀올 때', 'away'], ['보조가 필요하면<br>도와줄 수 있을 때', 'spot']];
  SC.b = { len: 30, cuts: [[0, N], [6, W], [24, O]], wipes: [6, 24], render(t, cam) {
    if (t < 3) {
      A('b1', t, .1, 2.95, 'chars', { st: .04 }); A('b2', t, .45, 2.95, 'chars', { st: .05 }); A('b3', t, .95, 2.95, 'chars', { st: .05 });
      A('b0', t, 1.5, 2.95, 'pop', { d: .4 });
      const x = $('bX'); const p = E.expo(prog(t, 2.0, 2.2)); x.style.opacity = t < 2 ? 0 : 1 - E.in(prog(t, 2.7, 2.95)); x.style.clipPath = `inset(0 ${100 - p * 100}% 0 0)`;
      cam.shake(2.0, 14, .3);
    } else if (t < 6) brand(t, 3, 5.95);
    else if (t < 24) {
      const i = Math.min(5, Math.floor((t - 6) / 3)), a = 6 + i * 3, [sit, key] = R[i], [ti, su] = CARDS[key];
      $('b5').textContent = `상황 0${i + 1} / 06`;
      if ($('b6t').dataset.k !== key) { $('b6t').innerHTML = sit; $('b6t').dataset.k = key; }
      $('b8t').textContent = ti; $('b8s').textContent = su; $('b8n').textContent = `0${i + 1}`;
      const orange = i % 2 === 0; $('b8c').style.background = orange ? O : N; $('b8c').style.color = orange ? N : W; $('b8t').style.color = !orange && i === 5 ? O : 'inherit';
      A('b5', t, a, a + 2.95, 'fade', { d: .2, xd: .12 });
      A('b6', t, a, a + 2.95, 'left', { d: .35, xd: .12 });
      A('b7', t, a + .9, a + 2.95, 'up', { xd: .12 });
      // 카드가 뒤집히며 나타남
      const el = $('b8'), f = prog(t, a + 1.0, a + 1.45), out = prog(t, a + 2.75, a + 2.98);
      el.style.opacity = t < a + 1.0 ? 0 : 1 - out;
      el.style.transform = `perspective(1600px) rotateY(${(1 - E.out(f)) * 90}deg) scale(${.9 + .1 * E.back(f)}) translateX(${-E.in(out) * 300}px)`;
      cam.shake(a + 1.0, 8, .2);
      A('b9', t, 6.6, 23.9, 'up');
    } else ending(t, 24, 30.5);
  } };
}

/* ===== C: 댓글 답장 - 카드 달면 넘어지지 않아요? (28초) ===== */
if (V === 'c') {
  mk('c1', '<div class="cmt"><div class="who"><span class="av"></span>@헬스초보</div><div class="txt">카드 달면 무거워서<br>쉐이커 넘어지는 거 아님?</div><div class="meta">답글 달기 · 좋아요 128</div></div>', 'left:90px;top:420px', '');
  mk('c2', '<div class="stamp">실험해 봄</div>', 'left:300px;top:1020px', '');
  mkh('c3', '물을 다 빼 볼게요', 'left:70px;top:320px;font-size:110px', 'bhs', true);
  mkh('c4', '<span id="c4n">700</span><span style="font-size:70px;margin-left:8px">mL</span>', 'left:72px;top:460px;font-size:170px;color:var(--o)', 'ant');
  mkh('c5', '거의 빈 쉐이커를<br>툭 밀어 봐도', 'left:70px;top:320px;font-size:110px', 'bhs', true);
  mkh('c7', '뒷면 균형 패드가<br>포켓 무게를 맞받쳐요', 'left:74px;top:600px;font-size:44px;line-height:1.45', 'b9');
  mk('c6', '<div class="stamp" style="background:var(--n)">안 넘어짐</div>', 'left:520px;top:620px', '');
  mkh('c8', '쉐이커 굵기만<br><span style="color:var(--o)">보면 돼요</span>', 'left:70px;top:320px;font-size:120px;color:var(--n)', 'bhs', true);
  mk('c9', '<div class="ant" style="font-size:110px;color:var(--o)">S</div><div class="b9" style="font-size:38px;color:var(--n)">캡슐·슬림 쉐이커<br>지름 7.5–9cm</div>', 'left:110px;top:1330px', '');
  mk('c10', '<div class="ant" style="font-size:110px;color:var(--o)">L</div><div class="b9" style="font-size:38px;color:var(--n)">700mL급 쉐이커<br>지름 9–10.5cm</div>', 'left:610px;top:1330px', '');
  mkh('c11', '단, 일회용 생수병은', 'left:70px;top:320px;font-size:110px;color:var(--n)', 'bhs', true);
  mkh('c12', '권장하지 않아요', 'left:70px;top:450px;font-size:130px;color:var(--o)', 'bhs', true);
  mk('c13', '<svg width="210" height="504" viewBox="0 0 150 360"><path d="M58 8h34v26c0 10 18 22 18 46v250c0 14-8 22-22 22H62c-14 0-22-8-22-22V80c0-24 18-36 18-46z" fill="none" stroke="#0E1240" stroke-width="7" stroke-linejoin="round"/><rect x="54" y="2" width="42" height="18" rx="4" fill="#0E1240"/><path d="M40 140h70M40 230h70" stroke="#0E1240" stroke-width="5" stroke-dasharray="10 9"/></svg>', 'left:380px;top:760px', '');
  mk('c14', '<svg width="340" height="340" viewBox="0 0 100 100"><path d="M10 10L90 90M90 10L10 90" stroke="#FF5A1F" stroke-width="13"/></svg>', 'left:560px;top:880px', '');
  mkh('c15', '물이 줄면 가벼워서 쓰러질 수 있어요.<br>쉐이커·텀블러에 써 주세요.', 'left:74px;top:1330px;font-size:42px;line-height:1.5;color:var(--n)', 'b9');
  SC.c = { len: 28, cuts: [[0, W], [3.5, N], [15, W], [22.5, O]], wipes: [3.5, 15, 22.5], render(t, cam) {
    if (t < 3.5) {
      A('c1', t, .15, 3.4, 'pop', { d: .45 }); A('c2', t, 1.8, 3.4, 'stamp', { d: .3 }); cam.shake(1.85, 16, .3);
    } else if (t < 6.5) brand(t, 3.5, 6.45);
    else if (t < 15) {
      A('c3', t, 6.5, 10.9, 'chars', { st: .04 }); A('c4', t, 6.8, 10.9, 'up');
      const dr = E.inOut(prog(t, 7.2, 10.4)); water(1 - dr); $('c4n').textContent = Math.round(700 * (1 - dr));
      A('c5', t, 11.0, 14.9, 'chars', { st: .035 }); A('c7', t, 13.4, 14.9, 'up'); A('c6', t, 12.9, 14.9, 'stamp', { d: .3 });
      let tilt = 0; if (t > 11.6) { const pp = prog(t, 11.6, 13.6); tilt = pp < .15 ? 17 * E.out(pp / .15) : 17 * (1 - spring((pp - .15) / .85, 5, 2.4)); }
      if (t > 10.4) water(0);
      $('sh').style.transformOrigin = '420px 1080px';
      placeShaker(560, 1140, .74, tilt);
      cam.shake(11.6, 12, .3); cam.shake(12.95, 14, .3);
    } else if (t < 22.5) {
      if (t < 19) {
        A('c8', t, 15.0, 18.9, 'chars', { st: .035 });
        placeCap(300, 970, .74 * Math.max(0, E.back(prog(t, 15.4, 15.9))));
        placeShaker(770, 990, .6 * Math.max(0, E.back(prog(t, 15.8, 16.3))), 0);
        A('c9', t, 16.0, 18.9, 'up'); A('c10', t, 16.4, 18.9, 'up');
      } else {
        A('c11', t, 19.0, 22.4, 'chars', { st: .03 }); A('c12', t, 19.35, 22.4, 'charsPop', { st: .05 });
        const b = $('c13'); b.style.opacity = 1; const fall = E.in(prog(t, 20.1, 20.55));
        b.style.transformOrigin = '160px 504px'; b.style.transform = `translate(${(1 - E.out(prog(t, 19.1, 19.6))) * 600}px,0) rotate(${fall * 78}deg)`;
        cam.shake(20.55, 14, .3); A('c14', t, 20.6, 22.4, 'pop', { d: .35 }); A('c15', t, 20.9, 22.4, 'up');
      }
    } else ending(t, 22.5, 28.5);
  } };
}
