import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrowMQ = matchMedia('(max-width: 900px)');
const HEX = { navy:'#0E1240', orange:'#FF5A1F', white:'#F5F5F0' };
const CARDS = window.SETSIGN_CARDS;
const byKey = Object.fromEntries(CARDS.map(c => [c.key, c]));
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const lerp = (a,b,t) => a + (b - a) * t;
const seg = (x,a,b) => clamp((x - a) / (b - a), 0, 1);
const sm = t => t * t * (3 - 2 * t);
const easeIO = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const wrapPi = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

/* ---------- 렌더러 ---------- */
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true }); }
catch (e) { document.documentElement.classList.add('no-gl'); throw e; }
window.__ss3d = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
camera.position.set(0, 0, 12);
const VIEW_H = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
/* 조명: 스튜디오 반사 환경 + 키·림 라이트. 재질은 게임 에셋처럼 PBR(거칠기·반사·투명도)로 표현 */
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .03).texture;
scene.add(new THREE.AmbientLight(0xffffff, .25));
const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(-4, 6, 8); scene.add(sun);
const rim = new THREE.DirectionalLight(0xffffff, 1.5); rim.position.set(6, 3, -5); scene.add(rim);

const V = (x,y) => new THREE.Vector2(x, y);
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function canvasTex(w, h, draw, repeatX) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.x = repeatX || 1; t.anisotropy = maxAniso;
  t.userData.redraw = () => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; }; t.userData.redraw();
  return t;
}
// 뚜껑 옆면의 미끄럼 방지 홈
const knurlTex = canvasTex(64, 8, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; g.fillRect(0, 0, w * .38, h); }, 60);
// 실리콘 밴드에 양각으로 찍힌 로고 (바깥 면은 텍스처 세로 37.5~50% 구간)
const embossTex = canvasTex(2048, 1024, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '84px Anton, Impact, sans-serif';
  for (let i = 0; i < 4; i++) g.fillText('SETSIGN', w * (i + .5) / 4, h * .5625 + 4);
});
// 쉐이커 옆면에 양각된 용량 눈금 (앞에서 왼쪽으로 60° 돌아간 자리, 세로는 몸통 위쪽 구간)
const gradTex = canvasTex(1024, 1024, (g, w, h) => {
  const x = w * .83; g.fillStyle = 'rgba(14,18,64,.78)'; const top = 8, bot = h - 4; g.textBaseline = 'middle'; g.font = '700 30px "Noto Sans KR", sans-serif';
  for (let i = 0; i <= 14; i++) {
    const y = bot - i * (bot - top) / 14, major = i % 2 === 0;
    if (!i) continue;
    g.fillRect(x - (major ? 34 : 18), y - 2, major ? 34 : 18, 4);
    if (major && i) g.fillText(String(i * 50) + (i === 14 ? ' ML' : ''), x + 10, y);
  }
});
// 바닥에 닿는 부드러운 그림자
const shadowTex = canvasTex(128, 128, (g, w, h) => {
  const im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - w / 2, y - h / 2) / (w / 2), a = Math.max(0, 1 - d), i = (y * w + x) * 4;
    im.data[i] = 14; im.data[i + 1] = 18; im.data[i + 2] = 64; im.data[i + 3] = a * a * 160;
  }
  g.putImageData(im, 0, 0);
});

const bodyMat = new THREE.MeshPhysicalMaterial({ color: HEX.white, roughness: .3, transparent: true, opacity: .56, clearcoat: .7, clearcoatRoughness: .18, side: THREE.DoubleSide, depthWrite: false });
const gradMat = new THREE.MeshBasicMaterial({ map: gradTex, transparent: true, depthWrite: false });
const footMat = new THREE.MeshStandardMaterial({ color: HEX.white, roughness: .55 });
const waterMat = new THREE.MeshBasicMaterial({ color: HEX.navy, transparent: true, opacity: .2, depthWrite: false });   // 물은 반사 없이 옅은 색으로만 표시
const surfMat = new THREE.MeshBasicMaterial({ color: HEX.white, transparent: true, opacity: .55, depthWrite: false });
const capMat = new THREE.MeshStandardMaterial({ color: HEX.orange, roughness: .46, bumpMap: knurlTex, bumpScale: 3 });
const lidMat = new THREE.MeshStandardMaterial({ color: HEX.orange, roughness: .46 });
const siliconeMat = new THREE.MeshPhysicalMaterial({ color: HEX.orange, roughness: .82, sheen: .7, sheenRoughness: .45, sheenColor: 0xffd9c8, bumpMap: embossTex, bumpScale: 2.5 });
const padMat = new THREE.MeshPhysicalMaterial({ color: HEX.orange, roughness: .86, sheen: .7, sheenRoughness: .45, sheenColor: 0xffd9c8 });
const shellMat = new THREE.MeshPhysicalMaterial({ color: HEX.navy, roughness: .42, clearcoat: .5, clearcoatRoughness: .3 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transparent: true, opacity: .18, depthWrite: false });
const dividerMat = new THREE.MeshStandardMaterial({ color: HEX.white, roughness: .5, transparent: true, opacity: .42, depthWrite: false });
const rivetMat = new THREE.MeshStandardMaterial({ color: 0xeceeef, metalness: 1, roughness: .2 });

/* ---------- 모델: 흔히 쓰는 프로틴 쉐이커 (특정 브랜드와 무관한 일반 형태) ---------- */
// 실제 비율: 700mL급 쉐이커 지름 약 9.6cm, 높이 약 24cm. 화면 1단위 ≈ 9.2cm
const root = new THREE.Group(), spin = new THREE.Group(), model = new THREE.Group();
scene.add(root); root.add(spin); spin.add(model);

// 몸통 두 가지: S는 위아래가 둥근 캡슐형, L은 아래로 살짝 좁아지는 기본형.
// 두 윤곽선을 같은 개수의 점으로 다시 나눠, 사이즈를 바꾸면 모양이 자연스럽게 변해요(모프 타깃)
const PROFILE_S = [[0,-1.25],[.56,-1.25],[.72,-1.22],[.84,-1.15],[.93,-1.04],[.985,-.88],[1,-.7],[1,.5],[.99,.52],[.975,.53]];
const PROFILE_L = [[0,-1.19],[.8,-1.19],[.86,-1.18],[.88,-1.17],[1,.82],[.985,.84]];
const TOP_S = .53, TOP_L = .82;
function resample(pts, n) {
  const seg = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]); seg.push(l); total += l; }
  const out = []; let i = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const d = total * k / (n - 1);
    while (i < seg.length - 1 && acc + seg[i] < d) { acc += seg[i]; i++; }
    const t = seg[i] ? Math.min(1, (d - acc) / seg[i]) : 0;
    out.push([lerp(pts[i][0], pts[i+1][0], t), lerp(pts[i][1], pts[i+1][1], t)]);
  }
  return out;
}
const PN = 72, PS = resample(PROFILE_S, PN), PL = resample(PROFILE_L, PN);
const profileAt = k => PS.map((a, i) => [lerp(a[0], PL[i][0], k), lerp(a[1], PL[i][1], k)]);
function radiusAt(prof, y) {                       // 윤곽선에서 높이 y의 반지름 (몸통 옆면 구간)
  for (let i = 1; i < prof.length; i++) {
    const a = prof[i-1], b = prof[i];
    if (b[1] > a[1] && y >= a[1] && y <= b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
  }
  return y < prof[0][1] ? 0 : prof[prof.length - 1][0];
}
function morphMesh(geoS, geoL, mat) {
  geoS.morphAttributes.position = [geoL.attributes.position];
  geoS.morphAttributes.normal = [geoL.attributes.normal];
  const m = new THREE.Mesh(geoS, mat); m.updateMorphTargets(); m.frustumCulled = false; return m;
}
const latheOf = prof => new THREE.LatheGeometry(prof.map(([x, y]) => V(x, y)), 96);
const bottle = new THREE.Group(), bottleShape = new THREE.Group();
model.add(bottle); bottle.add(bottleShape);
const body = morphMesh(latheOf(PS), latheOf(PL), bodyMat);
body.renderOrder = 3; bottleShape.add(body);
// 용량 눈금: 0mL(아래) ~ 700mL(위). 몸통 곡면을 그대로 따라감
const WATER_RANGE = { S: [-1.12, .45], L: [-1.15, .7] };
const gradShell = (prof, [y0, y1]) => latheOf(Array.from({ length: 28 }, (_, i) => { const y = lerp(y0, y1, i / 27); return [radiusAt(prof, y) + .006, y]; }));
const grads = morphMesh(gradShell(PS, WATER_RANGE.S), gradShell(PL, WATER_RANGE.L), gradMat);
grads.renderOrder = 6; bottleShape.add(grads);
// 기본형의 바닥 받침 (캡슐형은 둥근 바닥이라 없음)
const foot = new THREE.Mesh(new THREE.LatheGeometry([V(.8,-1.25), V(.86,-1.25), V(.9,-1.22), V(.9,-1.15), V(.87,-1.15), V(.82,-1.19), V(.8,-1.25)], 96), footMat);
const floor = new THREE.Mesh(new THREE.CircleGeometry(.86, 64), footMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.185;
bottleShape.add(foot, floor);
// 물: 몸통 안쪽 윤곽을 따라 수위까지 채움 (수위·모양이 바뀔 때만 다시 만듦)
const waterMesh = new THREE.Mesh(new THREE.BufferGeometry(), waterMat); waterMesh.renderOrder = 4; bottleShape.add(waterMesh);   // 반투명 통 위에 그려 물 높이가 잘 보이게
const surf = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 64), surfMat); surf.rotation.x = -Math.PI / 2; surf.renderOrder = 5; bottleShape.add(surf);   // 수면 가장자리 반사
let waterKey = '';
function updateWater(k, w) {
  const key = k.toFixed(3) + ':' + w.toFixed(3); if (key === waterKey) return; waterKey = key;
  const prof = profileAt(k), lo = lerp(WATER_RANGE.S[0], WATER_RANGE.L[0], k), hi = lerp(WATER_RANGE.S[1], WATER_RANGE.L[1], k);
  const level = lo + (hi - lo) * w, base = prof[0][1] + .03;
  const show = w > .004 && level > base + .01;
  waterMesh.visible = surf.visible = show; if (!show) return;
  const pts = [V(0, base)];
  for (const [x, y] of prof) if (y > base && y < level && x > .05) pts.push(V(x * .955, y));
  const rl = radiusAt(prof, level) * .955; pts.push(V(rl, level), V(0, level));
  waterMesh.geometry.dispose(); waterMesh.geometry = new THREE.LatheGeometry(pts, 64);
  surf.position.y = level; surf.scale.setScalar(rl);
}

// 뚜껑 L(기본형): 홈 파인 링 + 윗판 + 플립 캡 + 손잡이 고리. 단위는 몸통 반지름, 크기는 통째로 스케일
const capG = new THREE.Group(); bottle.add(capG);
capG.add(new THREE.Mesh(new THREE.LatheGeometry([V(.99,0), V(1.04,.03), V(1.04,.4), V(1.0,.44)], 96), capMat));
capG.add(new THREE.Mesh(new THREE.LatheGeometry([V(1.0,.44), V(.94,.5), V(.6,.56), V(0,.575)], 96), lidMat));
const flip = new THREE.Mesh(new RoundedBoxGeometry(.62, .1, .46, 3, .04), shellMat); flip.position.set(0, .6, .3); flip.rotation.x = -.06; capG.add(flip);
const tab = new THREE.Mesh(new RoundedBoxGeometry(.2, .06, .1, 2, .025), shellMat); tab.position.set(0, .6, .56); capG.add(tab);
const loop = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 16, 40, Math.PI), lidMat); loop.position.set(0, .54, -.55); capG.add(loop);
// 뚜껑 S(캡슐형): 굵은 홈 링 + 둥근 돔 + 플립 캡. 특정 제품의 로고·슬라이드 뚜껑은 쓰지 않은 일반 형태
const domeMat = new THREE.MeshStandardMaterial({ color: HEX.white, roughness: .55 });
const capS = new THREE.Group(); bottle.add(capS);
capS.add(new THREE.Mesh(new THREE.LatheGeometry([V(.97,0), V(1.07,.02), V(1.08,.05), V(1.08,.3), V(1.07,.33), V(.99,.35)], 96), capMat));
for (let i = 0; i < 12; i++) {
  const a = i / 12 * TAU, rib = new THREE.Mesh(new RoundedBoxGeometry(.08, .27, .06, 2, .02), lidMat);
  rib.position.set(Math.sin(a) * 1.09, .175, Math.cos(a) * 1.09); rib.rotation.y = a; capS.add(rib);
}
capS.add(new THREE.Mesh(new THREE.LatheGeometry([V(.99,.35), V(1,.42), V(.97,.56), V(.88,.7), V(.74,.81), V(.56,.88), V(.36,.92), V(0,.93)], 96), domeMat));
const flipS = new THREE.Mesh(new RoundedBoxGeometry(.7, .14, .52, 3, .05), shellMat); flipS.position.set(0, .95, .04); capS.add(flipS);
const tabS = new THREE.Mesh(new RoundedBoxGeometry(.22, .07, .12, 2, .03), lidMat); tabS.position.set(0, .98, .34); capS.add(tabS);
const loopS = new THREE.Mesh(new THREE.TorusGeometry(.2, .05, 14, 36, Math.PI), lidMat); loopS.position.set(0, .94, -.36); capS.add(loopS);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; bottle.add(shadow);

// 실리콘 밴드 + 뒷면 균형 패드(뒤쪽 120°만 4mm 두껍게, 같은 금형에서 한 번에 성형)
const BAND_Y = -.3, BIN = radiusAt(PL, BAND_Y);
const band = new THREE.Group(), bandShape = new THREE.Group();
model.add(band); band.add(bandShape);
const bandGeo = new THREE.LatheGeometry([V(BIN,-.27),V(BIN+.085,-.27),V(BIN+.085,-.21),V(BIN+.065,-.19),V(BIN+.065,.19),V(BIN+.085,.21),V(BIN+.085,.27),V(BIN,.27),V(BIN,-.27)], 96);
bandShape.add(new THREE.Mesh(bandGeo, siliconeMat));
const padGeo = new THREE.LatheGeometry([V(BIN+.06,-.2), V(BIN+.13,-.2), V(BIN+.15,-.17), V(BIN+.15,.17), V(BIN+.13,.2), V(BIN+.06,.2), V(BIN+.06,-.2)], 40, Math.PI * 2 / 3, Math.PI * 2 / 3);
const pad = new THREE.Mesh(padGeo, padMat); bandShape.add(pad);

// 2겹 카드 포켓 (모서리를 둥글린 케이스, 오른쪽이 열린 옆 입구). 카드는 신용카드 규격 85.6×54mm
const PW = 1.04, PH = .74, CW = .93, CH = .59, CD = .014;
const Z = { back:.016, B:.05, div:.074, A:.098, front:.124 };
const OFF = { band:.75, back:1.3, B:1.75, div:2.2, A:2.65, front:3.1 };
const pocket = new THREE.Group(); model.add(pocket);
const back = new THREE.Mesh(new RoundedBoxGeometry(PW, PH, .032, 3, .014), shellMat);
const divider = new THREE.Mesh(new THREE.BoxGeometry(PW - .05, PH - .05, .006), dividerMat);
const front = new THREE.Group();
const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW - .02, PH - .02), glassMat);
const barT = new THREE.Mesh(new RoundedBoxGeometry(PW, .08, .03, 3, .012), shellMat); barT.position.y = PH/2 - .04;
const barB = new THREE.Mesh(new RoundedBoxGeometry(PW, .08, .03, 3, .012), shellMat); barB.position.y = -(PH/2 - .04);
const barL = new THREE.Mesh(new RoundedBoxGeometry(.08, PH, .03, 3, .012), shellMat); barL.position.x = -(PW/2 - .04);
front.add(glass, barT, barB, barL);
[.24, -.24].forEach(y => {                                   // 포켓을 고정하는 금속 리벳
  const r = new THREE.Mesh(new THREE.CylinderGeometry(.017, .017, .012, 20), rivetMat);
  r.rotation.x = Math.PI / 2; r.position.set(-(PW/2 - .04), y, .018); front.add(r);
});
pocket.add(back, divider, front);

// 문구 카드
const texCache = {};
function drawCard(key) {
  const { c, t } = texCache[key], d = byKey[key], g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = HEX[d.bg]; g.fillRect(0, 0, W, H);
  g.fillStyle = HEX[d.ac]; g.fillRect(0, H - 44, W, 44);
  g.fillStyle = HEX[d.fg]; g.textBaseline = 'alphabetic';
  g.font = '34px Anton, Impact, sans-serif'; g.textAlign = 'left'; g.fillText('SETSIGN', 64, 92);
  g.textAlign = 'right'; g.fillText(d.n, W - 64, 92); g.textAlign = 'left';
  let fs = 170; const fam = '"Black Han Sans", "Noto Sans KR", sans-serif';
  g.font = `${fs}px ${fam}`;
  while (g.measureText(d.t).width > W - 128 && fs > 60) { fs -= 6; g.font = `${fs}px ${fam}`; }
  g.fillText(d.t, 62, 300);
  g.font = '700 38px "Noto Sans KR", sans-serif'; g.fillText(d.s, 66, 384);
  t.needsUpdate = true;
}
function cardTex(key) {
  if (!texCache[key]) {
    const c = document.createElement('canvas'); c.width = 768; c.height = 512;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texCache[key] = { c, t }; drawCard(key);
  }
  return texCache[key].t;
}
const cardGeo = new THREE.BoxGeometry(CW, CH, CD);
function makeCard() {
  const side = new THREE.MeshStandardMaterial({ color: HEX.white, roughness: .7 });
  const face = new THREE.MeshStandardMaterial({ color: 0xffffff, map: cardTex('together'), roughness: .58 });   // 코팅된 종이 카드
  const m = new THREE.Mesh(cardGeo, [side, side, side, side, face, side]);
  m.userData = { side, face }; return m;
}
function setCard(m, key) { m.userData.face.map = cardTex(key); m.userData.face.needsUpdate = true; m.userData.side.color.set(HEX[byKey[key].bg]); }
const cardA = makeCard(), cardB = makeCard();
pocket.add(cardA, cardB);
const cardKey = { A:'together', B:'set' };
setCard(cardA, cardKey.A); setCard(cardB, cardKey.B);
const allText = CARDS.map(c => c.t + c.s).join('') + 'SETSIGN0123456789';
if (document.fonts) {
  Promise.all(['170px "Black Han Sans"', '34px Anton', '700 38px "Noto Sans KR"']
    .map(f => document.fonts.load(f, allText).catch(() => {})))
    .then(() => { Object.keys(texCache).forEach(drawCard); embossTex.userData.redraw(); gradTex.userData.redraw(); });
}

/* ---------- 분해 이름표 ---------- */
const marker = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
const lblLayer = document.getElementById('labels');
const LABELS = [
  { name:'내 쉐이커 (미포함)', o: marker(bottle, 0, 1.42, 0) },
  { name:'실리콘 밴드',     o: marker(bandShape, -.72, .3, .72) },
  { name:'뒷면 균형 패드',  o: marker(bandShape, -.55, .24, -.95) },
  { name:'포켓 뒤판',       o: marker(back, -PW/2 + .1, PH/2 + .02, 0) },
  { name:'뒤 칸 카드',      o: marker(cardB, -CW/2 + .1, CH/2 + .02, 0), card:'B' },
  { name:'칸막이',          o: marker(divider, -PW/2 + .1, PH/2, 0) },
  { name:'앞 칸 카드',      o: marker(cardA, -CW/2 + .1, CH/2 + .02, 0), card:'A' },
  { name:'투명 앞판 · 옆 입구', o: marker(front, -PW/2 + .1, PH/2 + .02, 0) },
].map(l => { const el = document.createElement('span'); el.className = 'lbl'; el.textContent = l.name; lblLayer.appendChild(el); return { ...l, el }; });

/* ---------- 포즈 ---------- */
let W = innerWidth, H = innerHeight;
let userRot = 0, vel = 0, drag = null;
function applyPose(p) {
  const k = p.size, R = .47 + .06 * k, sy = 1 + .04 * k;      // k 0: S 캡슐형, 1: L 기본형
  bottleShape.scale.set(R, sy, R);
  body.morphTargetInfluences[0] = grads.morphTargetInfluences[0] = k;
  bodyMat.opacity = lerp(.86, .56, k); bodyMat.roughness = lerp(.55, .3, k); bodyMat.clearcoat = lerp(.15, .7, k);
  foot.visible = floor.visible = k > .5;
  const top = lerp(TOP_S, TOP_L, k) * sy;
  capG.visible = k >= .5; capS.visible = k < .5;
  capG.position.y = capS.position.y = top; capG.scale.setScalar(R); capS.scale.setScalar(R);
  LABELS[0].o.position.y = top + lerp(.62, .5, k);
  shadow.position.y = -1.252 * sy; shadow.scale.set(R * lerp(3.4, 4.4, k), R * lerp(3.4, 4.4, k), 1);
  updateWater(k, p.water);                                       // p.water = 물 양 ÷ 700mL
  const kb = lerp(radiusAt(PS, BAND_Y), BIN, k) / BIN;           // 밴드는 그 높이의 몸통 굵기에 맞춰 늘어남
  bandShape.scale.set(R * kb, 1, R * kb);
  const by = BAND_Y * sy, E = p.explode, st = (narrowMQ.matches ? .24 : .15) * E;
  band.position.set(0, by, OFF.band * E);
  pocket.position.set(0, by, R * kb * (BIN + .085));
  back.position.set(0, st, Z.back + OFF.back * E);
  divider.position.set(0, st * 3, Z.div + OFF.div * E);
  front.position.set(0, st * 5, Z.front + OFF.front * E);
  // 뽑기 / 바꿔 꽂기
  const s = p.swap, OUT = 1.12;
  const outA = Math.max(p.pull, sm(seg(s, 0, .28)) * (1 - sm(seg(s, .75, 1))));
  const outB = sm(seg(s, .32, .5)) * (1 - sm(seg(s, .78, 1)));
  const ex = sm(seg(s, .5, .72)), arc = Math.sin(ex * Math.PI) * .42;
  cardA.position.set(OUT * outA,  arc + st * lerp(4, 2, ex), lerp(Z.A, Z.B, ex) + E * lerp(OFF.A, OFF.B, ex));
  cardB.position.set(OUT * outB, -arc + st * lerp(2, 4, ex), lerp(Z.B, Z.A, ex) + E * lerp(OFF.B, OFF.A, ex));
  model.position.set(0, -st * 2, -1.55 * E);
  spin.rotation.y = p.rot + userRot;
  root.rotation.z = p.tilt;
  root.rotation.x = .13;                       // 살짝 내려다보는 각도: 뚜껑 윗면과 바닥 그림자가 보여요
  const upp = VIEW_H / H;
  root.position.set((p.x - W / 2) * upp, -(p.y - H / 2) * upp + p.bob * p.h * upp, 0);
  root.scale.setScalar(Math.max(1e-4, p.h * upp * .8 / 2.6 * p.zoom));
}

/* ---------- 무대(앵커)별 목표 ---------- */
const stages = [...document.querySelectorAll('[data-stage]')];
const track = document.querySelector('.how-track');
const tryState = { pull:0, swap:0, explode:0, size:0, water:250 / 700 };
document.addEventListener('ss:water', e => { tryState.water = clamp(+e.detail || 0, 0, 1); });
function storyP() { const r = track.getBoundingClientRect(); return clamp(-r.top / (r.height - H), 0, 1); }
function target(el, r, t) {
  const base = { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height, ol: el.dataset.bg === 'navy' ? 1 : 0, tilt:0, bob:0, size: tryState.size, water: tryState.water };
  const k = reduce ? 0 : 1;
  if (el.id === 'a-hero') {
    return { ...base, rot: Math.sin(t * .55) * .42 * k, tilt: Math.sin(t * .8) * .05 * k, bob: Math.sin(t * 1.1) * .012 * k, zoom:1, pull:0, swap:0, explode:0 };
  }
  if (el.id === 'a-story') {
    const P = storyP(), a = sm(seg(P, 0, .2)), E = sm(seg(P, .76, .94));
    const s = P < .24 ? 0 : P < .46 ? .3 * sm(seg(P, .24, .46)) : P < .5 ? .3 : P < .72 ? .3 + .7 * seg(P, .5, .72) : 1;
    const n = narrowMQ.matches;
    // 카드가 옆으로 빠져나오는 동안은 물병을 왼쪽으로 살짝 옮겨 화면 밖으로 잘리지 않게
    base.x -= r.width * (n ? .2 : .14) * sm(seg(P, .2, .28)) * (1 - sm(seg(P, .72, .8)));
    return { ...base, rot: (-TAU - .3) * a - .6 * E, zoom: (n ? .62 : .8) + .2 * a - (n ? .4 : .08) * E, pull:0, swap:s, explode:E };
  }
  const E = el.id === 'a-cards' ? 0 : tryState.explode, sw = tryState.swap;
  const outK = Math.max(tryState.pull, sm(seg(sw, 0, .15)) * (1 - sm(seg(sw, .85, 1))));
  base.x -= r.width * (narrowMQ.matches ? .2 : .1) * outK;
  return { ...base, rot: -.35 - .55 * E + Math.sin(t * .5) * .12 * k * (1 - E), zoom: 1 - (narrowMQ.matches ? .42 : .3) * E,
           pull: tryState.pull, swap: tryState.swap, explode: E };
}
function pick() {
  let best = null, bv = 0;
  for (const a of stages) { const r = a.getBoundingClientRect(); const v = Math.min(r.bottom, H) - Math.max(r.top, 0); if (v > bv) { bv = v; best = a; } }
  return best;
}

/* ---------- 드래그로 돌리기 ---------- */
stages.forEach(a => {
  a.addEventListener('pointerdown', e => { if (e.button > 0) return; drag = { x: e.clientX, id: e.pointerId }; vel = 0; try { a.setPointerCapture(e.pointerId); } catch {} });
  a.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const d = (e.clientX - drag.x) * .011; drag.x = e.clientX; userRot += d; vel = d; });
  const end = () => { drag = null; };
  a.addEventListener('pointerup', end); a.addEventListener('pointercancel', end); a.addEventListener('lostpointercapture', end);
  a.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { userRot -= .35; e.preventDefault(); }
    else if (e.key === 'ArrowRight') { userRot += .35; e.preventDefault(); }
  });
});

/* ---------- 버튼 모션 (트윈) ---------- */
const tweens = new Map();
function tween(key, to, dur, ease, done) {
  tweens.set(key, { from: tryState[key], to, dur: Math.max(.01, reduce ? Math.min(dur, .25) : dur), t:0, ease, done });
}
function stepTweens(dt) {
  for (const [k, tw] of tweens) {
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    tryState[k] = lerp(tw.from, tw.to, tw.ease === 'lin' ? tw.t : easeIO(tw.t));
    if (tw.t >= 1) { tweens.delete(k); tw.done && tw.done(); }
  }
}
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const btnPull = $('[data-act="pull"]'), btnSwap = $('[data-act="swap"]'), btnEx = $('[data-act="explode"]');
let busy = false;
function syncUI() {
  $('#now-front').textContent = byKey[cardKey.A].t;
  $('#now-back').textContent = byKey[cardKey.B].t;
  $$('.chip[data-card]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.card === cardKey.A)));
}
function setPullBtn(on) { btnPull.setAttribute('aria-pressed', String(on)); btnPull.textContent = on ? '다시 꽂기' : '카드 뽑기'; }
function doPull() { if (busy) return; const on = tryState.pull < .5; tween('pull', on ? 1 : 0, .65, 'io'); setPullBtn(on); }
function doSwap() {
  if (busy) return; busy = true;
  if (tryState.pull > 0) { tween('pull', 0, .35, 'io'); setPullBtn(false); }
  tween('swap', 1, 1.9, 'lin', () => {
    [cardKey.A, cardKey.B] = [cardKey.B, cardKey.A];
    setCard(cardA, cardKey.A); setCard(cardB, cardKey.B);
    tryState.swap = 0; busy = false; syncUI(); flush();
  });
}
let want = null;
function flush() { if (want && want !== cardKey.A) { const k = want; want = null; chooseCard(k, true); } else want = null; }
function chooseCard(key, quick) {            // quick: 카드 갤러리에서 스크롤로 고를 때
  if (busy) { if (quick) want = key; return; }
  if (key === cardKey.A) return;
  if (key === cardKey.B && !quick) return doSwap();
  busy = true; setPullBtn(false);
  const d = quick ? .32 : .45;
  tween('pull', 1, d, 'io', () => {
    if (key === cardKey.B) { cardKey.B = cardKey.A; setCard(cardB, cardKey.B); }
    cardKey.A = key; setCard(cardA, key); syncUI();
    tween('pull', 0, d, 'io', () => { busy = false; flush(); });
  });
}
document.addEventListener('ss:card', e => chooseCard(e.detail, true));
function setSize(v) {
  tween('size', v, .7, 'io');
  $$('.seg [data-size]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === v)));
}
function toggleExplode() {
  const on = tryState.explode < .5; tween('explode', on ? 1 : 0, 1.1, 'io');
  btnEx.setAttribute('aria-pressed', String(on)); btnEx.textContent = on ? '다시 조립' : '분해 보기';
}
const goTry = cb => { $('#try').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(cb, reduce ? 50 : 750); };
btnPull.addEventListener('click', doPull);
btnSwap.addEventListener('click', doSwap);
btnEx.addEventListener('click', toggleExplode);
$$('.seg [data-size]').forEach(b => b.addEventListener('click', () => setSize(Number(b.dataset.size))));
$$('[data-size-go]').forEach(b => b.addEventListener('click', () => goTry(() => setSize(Number(b.dataset.sizeGo)))));
$$('[data-card]').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.card;
  if (b.closest('#try')) chooseCard(k); else goTry(() => chooseCard(k));
}));

/* ---------- 루프 ---------- */
function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let act = null, from = null, tr = 1, last = performance.now(), wasOn = true, intro0 = null;
const tmp = new THREE.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (document.hidden) return;
  const t = now / 1000;
  stepTweens(dt);
  const a = pick() || act || stages[0];
  let cur = null;
  if (a !== act) { if (act && frame.cur) { from = { ...frame.cur }; tr = 0; } act = a; }
  const r = act.getBoundingClientRect();
  const tgt = target(act, r, t);
  if (tr < 1 && from) {
    tr = Math.min(1, tr + dt / (reduce ? .2 : .8));
    const e = easeIO(tr); cur = {};
    for (const k in tgt) cur[k] = k === 'rot' ? from.rot + wrapPi(tgt.rot - from.rot) * e : lerp(from[k], tgt[k], e);
  } else cur = tgt;
  frame.cur = cur;
  // 사용자 회전: 관성 + (스크롤 연출 중에는) 제자리로 복귀
  if (!drag) { userRot += vel; vel *= Math.pow(.9, dt * 60); if (Math.abs(vel) < 1e-4) vel = 0; }
  if (act.id === 'a-story' && !drag) userRot += (Math.round(userRot / TAU) * TAU - userRot) * Math.min(1, dt * 3);
  // 첫 등장: 물병이 돌면서 커짐
  if (intro0 === null) intro0 = t;
  const it = reduce ? 1 : 1 - Math.pow(1 - clamp((t - intro0 - .25) / 1.5, 0, 1), 4);
  applyPose(it < 1 ? { ...cur, zoom: cur.zoom * it, rot: cur.rot - (1 - it) * 3.4 } : cur);
  const on = r.bottom > -H * .6 && r.top < H * 1.6;
  root.visible = on;
  if (on || wasOn) renderer.render(scene, camera);
  wasOn = on;
  // 이름표
  const op = on ? clamp((cur.explode - .55) / .3, 0, 1) : 0;
  lblLayer.style.opacity = op;
  lblLayer.classList.toggle('on-white', cur.ol < .5);
  if (op > 0) {
    const aFront = cardA.position.z >= cardB.position.z;
    for (const l of LABELS) {
      if (l.card) l.el.textContent = (l.card === 'A') === aFront ? '앞 칸 카드' : '뒤 칸 카드';
      l.o.getWorldPosition(tmp).project(camera);
      l.el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px, ${((1 - tmp.y) / 2 * H).toFixed(1)}px)`;
    }
  }
}
requestAnimationFrame(frame);
