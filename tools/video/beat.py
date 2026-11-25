# SETSIGN 소개 영상용 비트 (120 BPM, 60초). 전부 코드로 합성해서 저작권 걱정이 없어요.
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 60.0
BEAT = 0.5          # 120 BPM
n = int(SR * DUR)
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(7)

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= n: return
    sig = sig[: n - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414
    R[i:i + len(sig)] += sig * gain * r * 1.414

def env(length, a=0.002, d=0.2):
    t = np.arange(int(length * SR)) / SR
    e = np.minimum(1, t / a) * np.exp(-t / d)
    return t, e

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)

def kick(power=1.0):
    t, e = env(0.45, 0.001, 0.16)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = rng.standard_normal(len(t)) * np.exp(-t * 300) * 0.25
    return (np.sin(ph) * e + click) * power

def clap():
    t, e = env(0.25, 0.001, 0.06)
    nz = rng.standard_normal(len(t))
    burst = np.zeros(len(t))
    for k in range(3):
        i = int(k * 0.011 * SR); burst[i:] += np.exp(-np.arange(len(t) - i) / SR / 0.012)
    return bp(nz, 900, 4000) * (burst * .5 + e) * 0.55

def hat(open_=False):
    t, e = env(0.18 if open_ else 0.06, 0.0005, 0.06 if open_ else 0.018)
    return hp(rng.standard_normal(len(t)), 7000) * e * 0.28

def note_freq(m): return 440 * 2 ** ((m - 69) / 12)

def bass(m, length):
    t, e = env(length, 0.004, length * 0.9)
    f = note_freq(m)
    saw = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 8))
    return lp(saw, 900) * e * 0.33

def pad(ms, length):
    t = np.arange(int(length * SR)) / SR
    e = np.minimum(1, t / 0.25) * np.minimum(1, (length - t) / 0.3)
    s = np.zeros(len(t))
    for m in ms:
        f = note_freq(m)
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            s += 2 / np.pi * np.arcsin(np.sin(2 * np.pi * ff * t))   # 삼각파
    return lp(s, 2200) * e * 0.045

def pluck(m, gain=1.0):
    t, e = env(0.5, 0.002, 0.12)
    f = note_freq(m)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
    return s * e * 0.16 * gain

def impact(power=1.0):
    t, e = env(1.6, 0.002, 0.45)
    boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 6)) * t) * e
    nz = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 7) * 0.5
    return (boom * 0.9 + nz) * power

def whoosh(length=0.45, up=True):
    t = np.arange(int(length * SR)) / SR
    x = rng.standard_normal(len(t))
    e = np.sin(np.pi * t / length) ** 2
    lo = bp(x, 500, 2500); hi = bp(x, 2500, 9000)
    mix = (t / length) if up else (1 - t / length)
    return (lo * (1 - mix) + hi * mix) * e * 0.35

def riser(length):
    t = np.arange(int(length * SR)) / SR
    x = rng.standard_normal(len(t))
    out = np.zeros(len(t)); seg = int(0.02 * SR)
    for i in range(0, len(t), seg):
        p = i / len(t); f = 400 + 7000 * p ** 2
        out[i:i + seg] = bp(x[i:i + seg + 200], f * 0.7, min(f * 1.4, 18000))[:len(out[i:i + seg])]
    return out * (t / length) ** 2 * 0.5

def tick():
    t, e = env(0.03, 0.0005, 0.006)
    return np.sin(2 * np.pi * 2400 * t) * e * 0.18

# 코드 진행 (마디 = 2초): Am - F - C - G
CHORDS = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]
def chord_at(t): return CHORDS[int(t // 2) % 4]

# ----- 리듬 섹션 -----
beats = np.arange(0, DUR, BEAT)
for b in beats:
    if b >= 58.0: break
    sec = b
    intro = sec < 3.0
    half = 3.0 <= sec < 6.0
    calm = 40.0 <= sec < 43.0
    # 킥
    if intro:
        if (sec % 2) in (0.0, 1.0): add(kick(.6), sec)
    elif half:
        if (sec % 2) == 0.0: add(kick(.9), sec)
    elif calm:
        if (sec % 2) == 0.0: add(kick(.75), sec)
    else:
        add(kick(1.0), sec)
    # 클랩 (2·4박)
    if not intro and (sec % 2) in (0.5, 1.5) and not (half and (sec % 2) == 0.5):
        add(clap(), sec, 0.9 if not calm else 0.6, 0.1)
    # 하이햇 (8분 뒷박)
    if sec >= 6.0 and not calm:
        add(hat(), sec + 0.25, 1.0, -0.3)
        if (sec % 2) == 1.5: add(hat(True), sec + 0.25, 0.8, 0.3)
    if sec >= 10.0 and not calm:
        add(hat(), sec, 0.5, 0.35)

# 베이스 (8분음, 6초부터)
t = 6.0
while t < 58.0:
    root, _ = chord_at(t)
    m = root - 12 + (12 if int(t * 4) % 4 == 3 else 0)
    if not (40.0 <= t < 43.0) or int(t * 2) % 2 == 0:
        add(bass(m, 0.22), t, 1.0)
    t += 0.25

# 패드 (마디마다)
for bar in range(0, 30):
    t0 = bar * 2.0
    if t0 >= 60: break
    _, ms = chord_at(t0)
    length = 2.0 if t0 < 56 else 4.0
    add(pad(ms, length), t0, 1.0 if t0 >= 3 else 0.6)
    if t0 >= 56: break

# 인트로 플럭 멜로디
for i, m in enumerate([69, 72, 76, 74, 72]):
    add(pluck(m, .8), 0.25 + i * 0.5, 1.0, -0.2)

# 카드 6장 넘어갈 때마다 플럭 (31초부터 1.5초 간격)
for i, m in enumerate([76, 79, 81, 79, 84, 88]):
    add(pluck(m, 1.2), 31.0 + i * 1.5, 1.0, 0.25 if i % 2 else -0.25)
    add(whoosh(0.3), 31.0 + i * 1.5 - 0.15, 0.5)

# 사용법 단계 시작마다 플럭
for i, m in enumerate([72, 74, 76, 79]):
    add(pluck(m, 1.1), 18.0 + i * 3.0, 1.0)

# 임팩트·전환 효과 (영상의 컷·충돌 지점과 맞춤)
add(impact(1.1), 3.0)                  # 말이 떨어지는 쿵
add(whoosh(0.3, False), 7.0, 1.2)      # 말풍선 사선
add(impact(0.7), 8.0)                  # 말 대신,
add(riser(0.55), 9.45, 1.0)            # 쉼표로 줌인
add(impact(1.2), 10.0)                 # 꽂아.
add(kick(.8), 11.75); add(tick(), 11.75, 2.0)   # 카드가 포켓에 착
for a in [6, 18, 30, 40, 46, 50, 56]:
    add(whoosh(0.42), a - 0.24, 1.0)
add(impact(0.6), 14.0)
add(impact(0.5), 47.75)                # 생수병 쓰러짐
for i in range(14):                     # 가격 올라가는 틱
    add(tick(), 50.5 + i * (1.0 / 14), 1.0)
add(impact(0.8), 50.4)
add(impact(1.1), 56.5)                  # 꽂아. (마무리)
for i, m in enumerate([81, 84, 88]):
    add(pluck(m, 1.0), 58.2 + i * 0.12, 1.0)

# 마스터: 살짝 압축 → 끝부분 페이드 → 정규화
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
fade = np.ones(n); fs = int(58.6 * SR); fade[fs:] = np.linspace(1, 0, n - fs) ** 1.5
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) / 0.89
wavfile.write('beat.wav', SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape[0] / SR, 's')
