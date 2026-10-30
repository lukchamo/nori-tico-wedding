#!/usr/bin/env node
// Renderiza el escenario de composición (stage.html) cuadro a cuadro a 30 fps y 1920×1080.
// El escenario expone window.__ready, window.__duration y window.__render(t) (ver assets/stage-template.html).
//
// Uso:
//   node render.cjs stills --stage proyecto/stage.html --clips proyecto/clips-seek --out proyecto/stills --times 2,10.5,48
//   node render.cjs video  --stage proyecto/stage.html --clips proyecto/clips-seek --out proyecto/out/video-noaudio.mp4 [--workers 3]
// Se sirve la carpeta del escenario como raíz y /clips/ apunta a --clips (los <video> piden "clips/NOMBRE.mp4").
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');

const mode = process.argv[2];
const args = Object.fromEntries(process.argv.slice(3).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
if (!['stills', 'video'].includes(mode) || !args.stage || !args.out) {
  console.error('Uso: node render.cjs <stills|video> --stage <stage.html> --clips <carpeta> --out <salida> [--times a,b,c] [--workers 3]');
  process.exit(1);
}
const FPS = 30;
const stagePath = path.resolve(args.stage), root = path.dirname(stagePath), clips = path.resolve(args.clips || path.join(root, 'clips'));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.mp4': 'video/mp4', '.json': 'application/json' };

const serve = () => new Promise(res => {
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const p = u.startsWith('/clips/') ? path.join(clips, u.slice('/clips/'.length)) : path.join(root, u);
    fs.stat(p, (e, st) => {
      if (e || !st.isFile()) { r.writeHead(404); return r.end(); }
      const type = types[path.extname(p).toLowerCase()] || 'application/octet-stream';
      const range = q.headers.range;
      if (range) { // los <video> necesitan Range para buscar cuadros
        const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, en = b ? +b : st.size - 1;
        r.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${s}-${en}/${st.size}`, 'content-length': en - s + 1 });
        fs.createReadStream(p, { start: s, end: en }).pipe(r);
      } else { r.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size }); fs.createReadStream(p).pipe(r); }
    });
  }).listen(0, () => res(srv));
});

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
const launch = () => chromium.launch({ headless: true, proxy, args: ['--ignore-certificate-errors', '--autoplay-policy=no-user-gesture-required', '--force-color-profile=srgb'] });
const openStage = async (browser, port) => {
  const pg = await browser.newPage({ viewport: { width: +(process.env.W || 1080), height: +(process.env.H || 1920) }, deviceScaleFactor: 1 });
  pg.on('pageerror', e => console.error('pageerror', e.message));
  pg.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/${path.basename(stagePath)}`, { waitUntil: 'load' });
  await pg.evaluate(() => window.__ready);
  if (process.env.HIDE) await pg.addStyleTag({ content: `${process.env.HIDE}{visibility:hidden!important}` }); // p. ej. HIDE='#subs' para el póster
  return pg;
};
// El primer cuadro tras cargar puede mostrar un video desactualizado: se pinta uno antes y se descarta.
const renderAt = async (pg, t) => { await pg.evaluate(t => window.__render(t), Math.max(0, t - 1 / FPS)); await pg.evaluate(t => window.__render(t), t); };

(async () => {
  const srv = await serve(); const port = srv.address().port;
  if (mode === 'stills') {
    fs.mkdirSync(args.out, { recursive: true });
    const browser = await launch(); const pg = await openStage(browser, port);
    for (const t of String(args.times || '1').split(',').map(Number)) {
      await renderAt(pg, t);
      await pg.screenshot({ path: path.join(args.out, `t${t.toFixed(1).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 80 });
    }
    await browser.close(); srv.close(); console.log('capturas en', args.out); return;
  }
  const workers = +(args.workers || 3);
  const b0 = await launch(); const p0 = await openStage(b0, port);
  const dur = await p0.evaluate(() => window.__duration); await b0.close();
  const from0 = Math.round((+args.from || 0) * FPS), to0 = Math.round((+args.to || dur) * FPS); // --from/--to para renderizar un tramo
  const total = to0 - from0, per = Math.ceil(total / workers), t0 = Date.now();
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  const parts = await Promise.all([...Array(workers)].map(async (_, w) => {
    const from = from0 + w * per, to = Math.min(to0, from + per); const part = args.out.replace(/\.mp4$/, `.part${w}.mp4`);
    if (from >= to) return null;
    const browser = await launch(); const pg = await openStage(browser, port); const cdp = await pg.context().newCDPSession(pg);
    await renderAt(pg, from / FPS);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), part], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = from; f < to; f++) {
      await pg.evaluate(t => window.__render(t), f / FPS);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - from) % 300 === 0) console.log(`proceso ${w}: ${f - from}/${to - from} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
    return part;
  }));
  const ok = parts.filter(Boolean);
  fs.writeFileSync(args.out + '.txt', ok.map(p => `file '${path.resolve(p)}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', args.out + '.txt', '-c', 'copy', args.out]);
  ok.forEach(p => fs.rmSync(p)); fs.rmSync(args.out + '.txt');
  console.log('video', args.out, total, 'cuadros en', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  srv.close();
})();
