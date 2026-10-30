#!/usr/bin/env node
// Graba un prototipo web cuadro a cuadro con TIEMPO VIRTUAL.
// El reloj de la página (requestAnimationFrame, performance.now, Date.now, setTimeout/setInterval y las
// animaciones CSS/WAAPI) se congela y se avanza exactamente 1/30 s por cuadro antes de cada captura.
// Resultado: animaciones perfectas a 30 fps aunque el renderizado por software sea lento.
//
// Uso:
//   node capture.cjs --choreo coreografias.cjs --name p1-desk --out clips/p1-desk.mp4 --root ./site
//   node capture.cjs --choreo coreografias.cjs --name p1-desk --out clips/p1-desk.mp4 --base https://demo.ejemplo.com/
// --root sirve una carpeta estática local; --base graba un sitio desplegado.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
if (!args.choreo || !args.name || !args.out || (!args.root && !args.base)) {
  console.error('Uso: node capture.cjs --choreo <archivo.cjs> --name <clip> --out <salida.mp4> (--root <carpeta> | --base <url>)');
  process.exit(1);
}
const C = require(path.resolve(args.choreo))[args.name];
if (!C) { console.error('Coreografía desconocida:', args.name); process.exit(1); }
const FPS = 30, DT = 1000 / FPS;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4' };

// Reloj virtual: se inyecta antes de cualquier script de la página
const VIRTUAL_TIME = () => {
  let vt = 0; const base = Date.now();
  const rafQ = new Map(); let rafId = 0;
  const timers = new Map(); let tId = 0;
  const anims = new WeakMap();
  performance.now = () => vt;
  Date.now = () => base + vt;
  window.requestAnimationFrame = cb => { rafQ.set(++rafId, cb); return rafId; };
  window.cancelAnimationFrame = id => rafQ.delete(id);
  window.setTimeout = (cb, ms = 0, ...a) => { timers.set(++tId, { cb, due: vt + Math.max(0, +ms || 0), a }); return tId; };
  window.clearTimeout = id => timers.delete(id);
  window.setInterval = (cb, ms = 0, ...a) => { const id = ++tId; const every = Math.max(1, +ms || 1); timers.set(id, { cb, due: vt + every, a, every }); return id; };
  window.clearInterval = id => timers.delete(id);
  const syncAnimations = () => {
    for (const a of document.getAnimations()) {
      let st = anims.get(a);
      if (st === undefined) { st = vt - (a.currentTime || 0); anims.set(a, st); try { a.pause(); } catch (e) {} }
      try { a.currentTime = vt - st; } catch (e) {}
    }
  };
  window.__vtAdvance = ms => {
    const end = vt + ms;
    for (;;) { // temporizadores en orden hasta el final del cuadro
      let next = null;
      for (const [id, t] of timers) if (t.due <= end && (!next || t.due < next[1].due)) next = [id, t];
      if (!next) break;
      const [id, t] = next; vt = Math.max(vt, t.due);
      if (t.every) t.due += t.every; else timers.delete(id);
      try { typeof t.cb === 'function' ? t.cb(...t.a) : (0, eval)(t.cb); } catch (e) { console.error(e); }
    }
    vt = end;
    const q = [...rafQ.entries()]; rafQ.clear();
    for (const [, cb] of q) { try { cb(vt); } catch (e) { console.error(e); } }
    syncAnimations();
  };
};

const start = async baseUrl => {
  const { vw, vh, dpr = 1, mobile } = C;
  const W = Math.round(vw * dpr), H = Math.round(vh * dpr);
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
  const browser = await chromium.launch({ headless: true, proxy, args: ['--ignore-certificate-errors', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-features=Translate', `--lang=${C.lang || 'es-CO'}`] });
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, isMobile: !!mobile, hasTouch: !!mobile, locale: C.lang || 'es-CO' });
  await ctx.addInitScript(VIRTUAL_TIME);
  if (C.cookies) await ctx.addCookies(C.cookies);
  const pg = await ctx.newPage();
  pg.on('pageerror', e => console.error('pageerror', e.message));
  await pg.goto(new URL((C.page || '') + (C.query || ''), baseUrl).href, { waitUntil: 'networkidle', timeout: 90000 });
  // Oculta barras de scroll y lo que no debe salir en video (etiquetas de demo, banners de cookies…)
  const hide = (C.hide || []).map(s => `${s}{display:none!important}`).join('');
  await pg.addStyleTag({ content: 'html{scrollbar-width:none} ::-webkit-scrollbar{display:none}' + hide + (C.css || '') });
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(({ cursor }) => {
    const st = document.createElement('style');
    st.textContent = `#__cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform:translate(-3px,-2px);filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));transition:none}
      .__rip{position:fixed;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:4px solid rgba(201,169,97,.95);background:rgba(201,169,97,.25);pointer-events:none;z-index:2147483646;animation:__rip .7s ease-out forwards}
      @keyframes __rip{from{transform:scale(.3);opacity:1}to{transform:scale(1.5);opacity:0}}`;
    document.head.appendChild(st);
    window.__ripple = (x, y) => { const d = document.createElement('div'); d.className = '__rip'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 900); };
    if (cursor) {
      const c = document.createElement('div'); c.id = '__cur';
      c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l7.5 19 2.6-7.4L20.5 11z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      document.body.appendChild(c);
      addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    }
  }, { cursor: !!C.cursor });
  const cdp = await ctx.newCDPSession(pg);
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', '15', args.out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const shot = async () => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true }); if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); };
  const advance = () => pg.evaluate(dt => window.__vtAdvance(dt), DT);

  for (let i = 0; i < Math.round((C.settle || 1200) / DT); i++) await advance(); // la página inicializa en tiempo virtual

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let frames = 0;
  const frame = async () => { await advance(); await shot(); frames++; };
  let mouse = C.mouseStart || [vw * .6, vh * .4];
  if (!mobile) await pg.mouse.move(mouse[0], mouse[1]);
  for (const s of C.steps) {
    if (s.wait) { for (let i = 0; i < Math.round(s.wait / DT); i++) await frame(); }
    else if (s.scroll !== undefined) {
      // scroll: selector CSS, píxeles absolutos o fracción (0–1) del recorrido total
      const [y0, y1] = await pg.evaluate(y => {
        const max = document.documentElement.scrollHeight - innerHeight;
        if (typeof y === 'string') { const el = document.querySelector(y); y = el ? el.getBoundingClientRect().top + scrollY + 1 : scrollY; }
        else if (y > 0 && y < 1) y = y * max;
        return [scrollY, Math.max(0, Math.min(max, y))];
      }, s.scroll);
      const n = Math.max(1, Math.round((s.dur || 2000) / DT));
      for (let i = 1; i <= n; i++) { await pg.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * ease(i / n)); await frame(); }
    }
    else if (s.hscroll) { // desplazamiento horizontal de un contenedor (carruseles)
      const n = Math.max(1, Math.round((s.dur || 1200) / DT)); const x0 = await pg.evaluate(sel => document.querySelector(sel)?.scrollLeft || 0, s.hscroll);
      for (let i = 1; i <= n; i++) { await pg.evaluate(([sel, x]) => { const el = document.querySelector(sel); if (el) el.scrollLeft = x; }, [s.hscroll, x0 + s.by * ease(i / n)]); await frame(); }
    }
    else if (s.mouse) { // recorrido suave del puntero (Catmull-Rom) por varios puntos
      const pts = [mouse, ...s.mouse]; const segs = pts.length - 1; const n = Math.max(1, Math.round((s.dur || 3000) / DT));
      for (let i = 1; i <= n; i++) {
        const u = ease(i / n) * segs, k = Math.min(segs - 1, Math.floor(u)), f = u - k;
        const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(segs, k + 2)];
        const cr = (a, b, c, d) => .5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
        mouse = [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
        await pg.mouse.move(mouse[0], mouse[1]); await frame();
      }
    }
    // clic por evaluate: las esperas de "actionability" de Playwright usan rAF y se bloquearían con el reloj congelado
    else if (s.click) { const ok = await pg.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; const r = el.getBoundingClientRect(); if (window.__ripple) window.__ripple(r.left + r.width / 2, r.top + r.height / 2); el.focus({ preventScroll: true }); el.click(); return true; }, s.click); if (!ok) console.error('No existe', s.click); await frame(); }
    else if (s.key) { await pg.keyboard.press(s.key); await frame(); }
    else if (s.tap) { // clic real del mouse en el centro de un elemento (con texto opcional) y onda visual
      const pt = await pg.evaluate(([sel, txt]) => { const el = [...document.querySelectorAll(sel)].find(e => !txt || e.textContent.includes(txt)); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, [s.tap, s.text || null]);
      if (!pt) { console.error('No existe', s.tap, s.text || ''); continue; }
      if (C.cursor) { const n = Math.round((s.dur || 700) / DT); const m0 = mouse; for (let i = 1; i <= n; i++) { const f = ease(i / n); mouse = [m0[0] + (pt[0] - m0[0]) * f, m0[1] + (pt[1] - m0[1]) * f]; await pg.mouse.move(mouse[0], mouse[1]); await frame(); } }
      await pg.evaluate(([x, y]) => window.__ripple(x, y), pt);
      await pg.mouse.click(pt[0], pt[1]); await frame();
    }
    else if (s.clickText) { // clic programático por texto del botón (+ onda en su centro)
      const ok = await pg.evaluate(([sel, txt]) => { const el = [...document.querySelectorAll(sel || 'button')].find(e => e.textContent.includes(txt)); if (!el) return false; const r = el.getBoundingClientRect(); window.__ripple(r.left + r.width / 2, r.top + r.height / 2); el.click(); return true; }, [s.sel || 'button', s.clickText]);
      if (!ok) console.error('No existe botón', s.clickText); await frame();
    }
    else if (s.ripple) { // onda sobre un selector antes de un click normal
      await pg.evaluate(sel => { const el = document.querySelector(sel); if (el) { const r = el.getBoundingClientRect(); window.__ripple(r.left + r.width / 2, r.top + r.height / 2); } }, s.ripple); await frame();
    }
    else if (s.type) { // escribe en un input/textarea controlado por React, letra a letra
      const [sel, text] = s.type; const per = Math.max(1, Math.round((s.dur || 1500) / DT / text.length));
      for (let i = 1; i <= text.length; i++) {
        await pg.evaluate(([sel, v]) => { const el = document.querySelector(sel); if (!el) return; const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, text.slice(0, i)]);
        for (let k = 0; k < per; k++) await frame();
      }
    }
    else if (s.eval) { await pg.evaluate(s.eval); await frame(); }
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(args.name, 'cuadros', frames, (frames / FPS).toFixed(1) + 's', args.out);
  await browser.close();
};

if (args.base) start(args.base.endsWith('/') ? args.base : args.base + '/').catch(e => { console.error(e); process.exit(1); });
else {
  const root = path.resolve(args.root);
  const srv = http.createServer((q, r) => {
    let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith(path.sep) || p.endsWith('/')) p = path.join(p, 'index.html');
    if (!path.extname(p) && fs.existsSync(p + '.html')) p += '.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p).toLowerCase()] || 'application/octet-stream' }); r.end(d); });
  }).listen(0, () => start(`http://127.0.0.1:${srv.address().port}/`).then(() => srv.close()).catch(e => { console.error(e); srv.close(); process.exit(1); }));
}
