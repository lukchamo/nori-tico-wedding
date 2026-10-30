#!/usr/bin/env node
// Genera las imágenes Open Graph (1200x630, vista previa de WhatsApp) y los íconos del sitio.
// Uso: node scripts/render-og.mjs   (requiere Playwright con Chromium disponible)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = resolve(import.meta.dirname, "..");
const b64 = (p) => `data:image/jpeg;base64,${readFileSync(resolve(root, p)).toString("base64")}`;
const photo = b64("public/assets/foto-sobre.jpg");
const envelope = b64("public/assets/sobre-textura.jpg");

const FONTS =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=block";

const LEAF = "M0,-9 C5,-7 6,-2 4,3 C2,7 -2,7 -4,3 C-6,-2 -5,-7 0,-9 Z";
const leaves = [
  ["#4B5A2F", 0.85, "translate(8,9) rotate(-30) scale(0.85)"],
  ["#6E7C4D", 0.8, "translate(17,5) rotate(-5) scale(1)"],
  ["#ADB497", 0.85, "translate(28,11) rotate(20) scale(0.8)"],
  ["#4B5A2F", 0.7, "translate(40,7) rotate(-15) scale(0.65)"],
  ["#6E7C4D", 0.7, "translate(51,14) rotate(35) scale(0.55)"],
  ["#ADB497", 0.6, "translate(63,18) rotate(10) scale(0.45)"],
];
const half = `<path d="M2,4 C28,13 52,6 76,13" fill="none" stroke="#6E7C4D" stroke-width="0.8" opacity="0.4"/>${leaves
  .map(([f, o, t]) => `<path d="${LEAF}" fill="${f}" opacity="${o}" transform="${t}"/>`)
  .join("")}<g transform="translate(21,16) scale(0.5)">${[0, 72, 144, 216, 288]
  .map((r) => `<g transform="rotate(${r})"><ellipse cx="0" cy="-4" rx="2.6" ry="3.6" fill="#FBF9F2" opacity="0.95"/></g>`)
  .join("")}<circle r="1.8" fill="#C9A961"/></g>`;
const sprig = `<svg viewBox="0 0 480 50" width="440" height="46"><g>${half}</g><g transform="translate(480,0) scale(-1,1)">${half}</g></svg>`;
const heart = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="1.4"><path d="M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z"/></svg>`;

const ogHtml = ({ eyebrow, badge, lead }) => `<!doctype html><html><head><meta charset="utf-8">
<link href="${FONTS}" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1200px;height:630px;overflow:hidden;background:#FBF9F2;font-family:'Cormorant Garamond',serif;}
  .wrap{position:relative;width:1200px;height:630px;display:flex;
    background:radial-gradient(circle at 70% 40%,#FDFBF4 0%,#F4EFDF 70%,#ECE5CF 100%);}
  .photo{position:relative;width:470px;height:630px;flex:none;overflow:hidden}
  .photo img{width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
  .photo::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0) 70%,rgba(244,239,223,.55) 100%)}
  .seal{position:absolute;left:400px;top:236px;width:150px;height:150px;border-radius:50%;
    background:url('${envelope}');background-size:647px 459px;background-position:-249px -181px;
    box-shadow:0 14px 30px rgba(40,40,10,.35);border:3px solid #FBF9F2;z-index:3}
  .text{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 36px 0 96px;gap:12px}
  .eyebrow{font-style:italic;font-size:34px;color:#4B5A2F}
  .badge{font-family:'Playfair Display',serif;font-size:15px;letter-spacing:4px;text-transform:uppercase;color:#4B5A2F;
    border:1px solid #C9A961;border-radius:999px;padding:8px 22px;background:rgba(201,169,97,.12)}
  .names{font-family:'Great Vibes',cursive;font-size:88px;line-height:1.1;color:#4B5A2F;margin-top:2px;white-space:nowrap}
  .rule{display:flex;align-items:center;gap:14px;width:300px}
  .rule i{flex:1;height:1px;background:#C9A961}
  .lead{font-size:28px;color:#3A3F2E;font-weight:500}
  .date{display:flex;gap:12px;margin-top:6px}
  .date div{background:#4B5A2F;color:#FBF9F2;border-radius:14px;padding:12px 22px;font-family:'Playfair Display',serif;font-size:30px;font-weight:600}
  .sprig{opacity:.95}
</style></head><body><div class="wrap">
  <div class="photo"><img src="${photo}"></div>
  <div class="seal"></div>
  <div class="text">
    <div class="sprig">${sprig}</div>
    ${badge ? `<div class="badge">${badge}</div>` : `<div class="eyebrow">${eyebrow}</div>`}
    <div class="names">Norida &amp; Agustín</div>
    <div class="rule"><i></i>${heart}<i></i></div>
    <div class="lead">${lead}</div>
    <div class="date"><div>27</div><div>12</div><div>2026</div></div>
  </div>
</div></body></html>`;

const iconHtml = (size) => `<!doctype html><html><head><meta charset="utf-8"><link href="${FONTS}" rel="stylesheet">
<style>*{margin:0}body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}
.c{width:${size}px;height:${size}px;border-radius:${size * 0.22}px;background:#4B5A2F;display:flex;align-items:center;justify-content:center;
font-family:'Great Vibes',cursive;color:#C9A961;font-size:${size * 0.3}px;line-height:1;white-space:nowrap;padding-top:${size * 0.04}px;box-shadow:inset 0 0 0 ${Math.max(2, size * 0.02)}px rgba(201,169,97,.55)}</style>
</head><body><div class="c">N&amp;A</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

async function shot(html, path, opts) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, path), ...opts });
  console.log("✓", path);
}

await shot(ogHtml({ eyebrow: "Nos casamos", lead: "Te invitamos a celebrar nuestro amor" }), "public/og/invitacion.jpg", { type: "jpeg", quality: 86 });
await shot(ogHtml({ badge: "Participación de matrimonio", lead: "Con la bendición de Dios y nuestros padres" }), "public/og/participacion.jpg", {
  type: "jpeg",
  quality: 86,
});

for (const [size, path] of [
  [512, "app/icon.png"],
  [180, "app/apple-icon.png"],
]) {
  await page.setViewportSize({ width: size, height: size });
  await shot(iconHtml(size), path, { type: "png", omitBackground: true });
}

await browser.close();
