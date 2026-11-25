# 숏폼 3편용 비트: 영상마다 장면 전환·충돌 지점에 맞춘 효과음을 넣어요. 전부 코드로 합성.
import numpy as np, sys
import beatlib as B
from scipy.io import wavfile

def make(name, dur, full_from, ev):
    SR = B.SR; n = int(SR * dur)
    B.n = n; B.L = np.zeros(n); B.R = np.zeros(n); B.DUR = dur
    add = B.add
    for k in np.arange(0, dur - 1.5, .5):
        k = round(float(k), 2); full = k >= full_from
        if full: add(B.kick(1.0), k)
        elif k % 1 == 0: add(B.kick(.6), k)
        if full and k % 1 == .5: add(B.clap(), k, .85, .1)
        if full: add(B.hat(), k + .25, 1.0, -.3)
        if full and k % 2 == 1.5: add(B.hat(True), k + .25, .7, .3)
    t = full_from
    while t < dur - 1.5:
        root, _ = B.chord_at(t); m = root - 12 + (12 if int(t * 4) % 4 == 3 else 0)
        add(B.bass(m, .22), t); t += .25
    for bar in range(int(dur // 2) + 1):
        t0 = bar * 2.0
        if t0 >= dur - .5: break
        _, ms = B.chord_at(t0); add(B.pad(ms, min(2.0, dur - t0)), t0, 1.0 if t0 >= full_from else .6)
    for kind, at, *g in ev:
        g = g[0] if g else 1.0
        if kind == 'imp': add(B.impact(g), at)
        elif kind == 'wh': add(B.whoosh(.42), at - .24, g)
        elif kind == 'whd': add(B.whoosh(.3, False), at, g)
        elif kind == 'pl': add(B.pluck(int(g)), at, 1.0)
        elif kind == 'tick': add(B.tick(), at, g)
        elif kind == 'rise': add(B.riser(g), at, 1.0)
    mix = np.stack([B.L, B.R], axis=1); mix = np.tanh(mix * 1.4) / np.tanh(1.4)
    fade = np.ones(n); fs = int((dur - 1.4) * SR); fade[fs:] = np.linspace(1, 0, n - fs) ** 1.5
    mix *= fade[:, None]; mix /= np.max(np.abs(mix)) / .89
    wavfile.write(f'beat_{name}.wav', SR, (mix * 32767).astype(np.int16)); print(name, dur)

ticks = lambda a, b, k: [('tick', a + i * (b - a) / k, .8) for i in range(k)]
make('a', 28, 9.0, [('pl', .1, 69), ('pl', 2.0, 72), ('pl', 2.75, 76), *ticks(3.5, 5.6, 21), ('whd', 6.0, .8), ('rise', 7.3, .55), ('imp', 7.85, 1.1),
                    ('wh', 9.0), ('imp', 9.0, .7), ('pl', 13.15, 72), ('pl', 15.65, 74), ('pl', 18.15, 76), ('wh', 13.0), ('wh', 21.0), ('imp', 21.45, 1.1), ('imp', 22.6, .6), ('pl', 25.4, 81), ('pl', 25.52, 84), ('pl', 25.64, 88)])
make('b', 30, 3.0, [('pl', .1, 69), ('pl', .45, 72), ('pl', .95, 76), ('whd', 2.0, 1.2), ('imp', 2.0, .8), ('imp', 3.0, .7), ('wh', 6.0),
                    *[('pl', 7.0 + 3 * i, [76, 79, 81, 79, 84, 88][i]) for i in range(6)], *[('whd', 8.75 + 3 * i, .6) for i in range(6)], ('wh', 24.0), ('imp', 24.45, 1.1), ('imp', 25.6, .6), ('pl', 27.4, 81), ('pl', 27.52, 84), ('pl', 27.64, 88)])
make('c', 28, 3.5, [('pl', .15, 72), ('imp', 1.85, .9), ('wh', 3.5), ('imp', 3.5, .7), ('rise', 7.2, 3.2), ('whd', 11.6, 1.1), ('imp', 12.95, 1.0),
                    ('wh', 15.0), ('pl', 15.4, 76), ('pl', 15.8, 79), ('pl', 19.0, 72), ('imp', 20.55, .7), ('wh', 22.5), ('imp', 22.95, 1.1), ('imp', 24.1, .6), ('pl', 24.9, 81), ('pl', 25.02, 84), ('pl', 25.14, 88)])
