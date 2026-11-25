const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
(async () => {
  const v = process.argv[2]; const FPS = 30;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/shorts.html?v=' + v); await p.evaluate(() => window.ready);
  const len = await p.evaluate(() => window.LEN);
  const tmp = `seg/s_${v}.tmp.mp4`, out = `seg/s_${v}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  for (let i = 0; i < len * FPS; i++) { await p.evaluate(t => render(t), i / FPS); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); const code = await done;
  if (code === 0) { fs.renameSync(tmp, out); console.log('done', out, len + 's'); } else console.log('FAILED', v, code);
  if (errs.length) console.log(errs); await b.close();
})();
