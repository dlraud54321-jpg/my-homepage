// 사용: node render2.cjs <이름> <표시글(없으면 '')> <시작:길이,...>
// 구간마다 파일 하나로 인코딩하고, 끝까지 성공하면 이름을 바꿔요.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const FPS = 30;
(async () => {
  const [name, tag, list] = process.argv.slice(2);
  const segs = list.split(',').map(x => x.split(':').map(Number));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/video.html' + (tag ? '?tag=' + encodeURIComponent(tag) : '')); await p.evaluate(() => window.ready);
  fs.mkdirSync('seg', { recursive: true });
  for (const [s0, dur] of segs) {
    const tmp = `seg/${name}_${String(s0).padStart(2, '0')}.tmp.mp4`, out = tmp.replace('.tmp', '');
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', '60', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    for (let i = 0; i < Math.round(dur * FPS); i++) {
      await p.evaluate(t => render(t), s0 + i / FPS);
      const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); const code = await done;
    if (code === 0) { fs.renameSync(tmp, out); console.log('done', out); } else console.log('FAILED', out, code);
  }
  if (errs.length) console.log('errors', errs);
  await b.close();
})();
