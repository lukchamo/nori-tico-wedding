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
const look = (id) => b64(`public/lookbook/${id}.jpg`);
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

const PALETTE = ["#8A9A6B", "#BF7E5A", "#9FB4C7", "#D3A8A0"];
const dots = PALETTE.map((c) => `<i style="background:${c}"></i>`).join("");

// Asesoras de outfits: collage del lookbook + burbujas del chat.
const advisorsHtml = () => `<!doctype html><html><head><meta charset="utf-8"><link href="${FONTS}" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1200px;height:630px;overflow:hidden;font-family:'Cormorant Garamond',serif;color:#FBF9F2;
    background:radial-gradient(circle at 18% 20%,#5E6F3A 0%,#4B5A2F 45%,#3A4724 100%)}
  .grain{position:absolute;inset:0;opacity:.18;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.5'/></svg>")}
  .left{position:absolute;left:72px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:14px}
  .eyebrow{font-family:'Playfair Display',serif;font-size:14px;letter-spacing:5px;text-transform:uppercase;color:#C9A961}
  .avatars{display:flex;margin:6px 0 2px}
  .av{width:74px;height:74px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Great Vibes',cursive;
    font-size:44px;color:#4B5A2F;border:3px solid #4B5A2F;box-shadow:0 0 0 2px #C9A961}
  .av+.av{margin-left:-16px}
  h1{font-family:'Great Vibes',cursive;font-weight:400;font-size:92px;line-height:1;color:#FBF9F2;text-shadow:0 6px 24px rgba(0,0,0,.25)}
  .sub{font-family:'Playfair Display',serif;font-size:18px;letter-spacing:7px;text-transform:uppercase;color:#C9A961}
  ul{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:10px}
  li{font-size:27px;font-weight:500;color:rgba(251,249,242,.92);display:flex;align-items:center;gap:12px}
  li b{display:inline-flex;width:38px;height:38px;border-radius:50%;align-items:center;justify-content:center;font-size:19px;background:rgba(251,249,242,.12);border:1px solid rgba(201,169,97,.5)}
  .dots{display:flex;gap:10px;margin-top:12px}
  .dots i{width:22px;height:22px;border-radius:50%;border:2px solid rgba(251,249,242,.7)}
  .card{position:absolute;width:230px;height:307px;border-radius:18px;overflow:hidden;border:7px solid #FBF9F2;box-shadow:0 26px 50px rgba(0,0,0,.4)}
  .card img{width:100%;height:100%;object-fit:cover;display:block}
  .card span{position:absolute;left:10px;bottom:10px;right:10px;font-size:18px;font-weight:600;color:#FBF9F2;text-shadow:0 2px 8px rgba(0,0,0,.6)}
  .c1{left:640px;top:150px;transform:rotate(-9deg)}
  .c2{left:900px;top:120px;transform:rotate(8deg)}
  .c3{left:770px;top:210px;transform:rotate(-1deg);width:250px;height:333px;z-index:2}
  .bubble{position:absolute;z-index:3;font-size:23px;font-weight:600;padding:12px 18px;border-radius:22px;box-shadow:0 14px 30px rgba(0,0,0,.3);white-space:nowrap}
  .q{left:690px;top:62px;background:#FBF9F2;color:#4B5A2F;border-bottom-right-radius:6px}
  .a{left:820px;top:548px;background:#C9A961;color:#2F3A1C;border-bottom-left-radius:6px}
</style></head><body>
  <div class="grain"></div>
  <div class="left">
    <div class="eyebrow">Boda Norida &amp; Agustín · 27.12.2026</div>
    <div class="avatars"><div class="av" style="background:#D3A8A0">G</div><div class="av" style="background:#9FB4C7">V</div></div>
    <h1>Gabriela y Valentina</h1>
    <div class="sub">Asesoras de outfits</div>
    <ul>
      <li><b>👗</b>Looks para una boda de día</li>
      <li><b>📸</b>Analizamos la foto de tu outfit</li>
      <li><b>✨</b>Ideas para combinar zapatos y accesorios</li>
    </ul>
    <div class="dots">${dots}</div>
  </div>
  <div class="card c1"><img src="${look("h-guayabera-salvia")}"></div>
  <div class="card c2"><img src="${look("m-boho-azul")}"></div>
  <div class="card c3"><img src="${look("m-midi-salvia")}"><span>Midi verde salvia</span></div>
  <div class="bubble q">¿Qué me pongo para la boda? 🤔</div>
  <div class="bubble a">¡Verde salvia y mocasines de ante! 🌿</div>
</body></html>`;

// Backoffice: maqueta del panel (sin datos reales) + acceso con PIN.
const backofficeHtml = () => `<!doctype html><html><head><meta charset="utf-8"><link href="${FONTS}" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1200px;height:630px;overflow:hidden;font-family:'Cormorant Garamond',serif;color:#2D3122;
    background:radial-gradient(circle at 25% 30%,#FDFBF4 0%,#F4EFDF 60%,#E9E2CA 100%)}
  .left{position:absolute;left:70px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center;gap:14px}
  .mono{width:86px;height:86px;border-radius:22px;background:#4B5A2F;display:flex;align-items:center;justify-content:center;
    font-family:'Great Vibes',cursive;font-size:28px;white-space:nowrap;padding-top:4px;color:#C9A961;box-shadow:inset 0 0 0 2px rgba(201,169,97,.55),0 12px 24px rgba(75,90,47,.25)}
  .eyebrow{font-family:'Playfair Display',serif;font-size:14px;letter-spacing:5px;text-transform:uppercase;color:#6E7C4D;margin-top:6px}
  h1{font-family:'Playfair Display',serif;font-weight:500;font-size:58px;line-height:1.05;color:#2F3A1C}
  .names{font-family:'Great Vibes',cursive;font-size:44px;color:#4B5A2F;line-height:1}
  ul{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:6px}
  li{font-size:25px;font-weight:600;color:#3A3F2E;display:flex;align-items:center;gap:12px}
  li b{display:inline-flex;width:34px;height:34px;border-radius:10px;align-items:center;justify-content:center;font-size:17px;background:#fff;border:1px solid #E4E0D0}
  .pin{display:inline-flex;align-items:center;gap:10px;margin-top:8px;align-self:flex-start;background:#4B5A2F;color:#FBF9F2;border-radius:999px;padding:9px 18px;
    font-family:'Playfair Display',serif;font-size:14px;letter-spacing:3px;text-transform:uppercase}
  .pin span{display:inline-flex;gap:6px}.pin span i{width:9px;height:9px;border-radius:50%;background:#C9A961}
  .shot{position:absolute;left:585px;top:62px;width:570px;height:506px;border-radius:20px;background:#F4F2EA;overflow:hidden;
    box-shadow:0 40px 80px rgba(47,58,28,.28),0 0 0 1px rgba(75,90,47,.12);transform:perspective(1400px) rotateY(-9deg) rotateX(3deg);transform-origin:left center}
  .bar{height:52px;background:#4B5A2F;display:flex;align-items:center;gap:18px;padding:0 20px;font-family:system-ui,sans-serif;font-size:13px;color:rgba(251,249,242,.8)}
  .bar .m{font-family:'Great Vibes',cursive;font-size:26px;color:#C9A961}
  .bar .on{background:rgba(201,169,97,.25);color:#fff;padding:6px 10px;border-radius:8px}
  .body{padding:18px 20px;display:grid;gap:12px;font-family:system-ui,sans-serif}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .kpi{background:#fff;border:1px solid #E4E0D0;border-radius:12px;padding:12px}
  .kpi.a{background:#4B5A2F;border-color:#4B5A2F}
  .kpi small{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#6B6F5C}
  .kpi.a small{color:rgba(251,249,242,.75)}
  .kpi .v{height:22px;width:58%;border-radius:6px;background:#E9E5D6;margin-top:8px}
  .kpi.a .v{background:rgba(251,249,242,.35)}
  .kpi .s{height:8px;width:80%;border-radius:4px;background:#F1EEE3;margin-top:7px}
  .kpi.a .s{background:rgba(251,249,242,.18)}
  .row{display:grid;grid-template-columns:1.25fr 1fr;gap:10px}
  .box{background:#fff;border:1px solid #E4E0D0;border-radius:12px;padding:12px 14px}
  .box h4{font-size:12px;font-weight:600;margin-bottom:10px;color:#2D3122}
  .f{display:grid;grid-template-columns:72px 1fr;align-items:center;gap:8px;font-size:11px;color:#6B6F5C;margin:7px 0}
  .f div{height:9px;border-radius:9px;background:#F1EEE3;overflow:hidden}.f div i{display:block;height:100%;border-radius:9px}
  .ev{display:flex;gap:9px;align-items:flex-start;margin:8px 0}
  .ev b{width:24px;height:24px;flex:none;border-radius:50%;background:#FAF8F1;border:1px solid #E4E0D0;display:flex;align-items:center;justify-content:center;font-size:12px}
  .ev div{flex:1}.ev p{height:7px;border-radius:4px;background:#ECE8DA;margin:4px 0}
  .ev .note{background:#FFFAF0;border:1px solid #F0E5C8;border-radius:8px;padding:6px 8px}
  .tbl{background:#fff;border:1px solid #E4E0D0;border-radius:12px;padding:6px 14px}
  .tr{display:grid;grid-template-columns:1.6fr .5fr .9fr .9fr;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #EFECE2}
  .tr:first-child{border-top:none}
  .tr p{height:8px;border-radius:4px;background:#E6E2D3}
  .pill{font-size:10px;padding:3px 8px;border-radius:999px;justify-self:start}
  .wa{font-size:10px;color:#fff;background:#1F8F4E;border-radius:7px;padding:4px 8px;justify-self:start}
</style></head><body>
  <div class="left">
    <div class="mono">N&amp;A</div>
    <div class="eyebrow">Backoffice privado</div>
    <h1>Gestión de invitados</h1>
    <div class="names">Norida &amp; Agustín · 27.12.2026</div>
    <ul>
      <li><b>✅</b>Confirmaciones en tiempo real</li>
      <li><b>📲</b>Envío de invitaciones por WhatsApp</li>
      <li><b>💬</b>Comentarios y seguimiento por invitado</li>
    </ul>
    <div class="pin">Acceso con PIN <span><i></i><i></i><i></i><i></i></span></div>
  </div>
  <div class="shot">
    <div class="bar"><span class="m">N&amp;A</span><span class="on">Resumen</span><span>Invitados</span><span>Actividad</span><span>Asesoras IA</span></div>
    <div class="body">
      <div class="kpis">
        <div class="kpi a"><small>Confirmados</small><div class="v"></div><div class="s"></div></div>
        <div class="kpi"><small>Pendientes</small><div class="v"></div><div class="s"></div></div>
        <div class="kpi"><small>Enviadas</small><div class="v"></div><div class="s"></div></div>
      </div>
      <div class="row">
        <div class="box"><h4>Embudo de invitaciones</h4>
          <div class="f">Por enviar<div><i style="width:38%;background:#C9C6B5"></i></div></div>
          <div class="f">Enviada<div><i style="width:62%;background:#4F76A0"></i></div></div>
          <div class="f">Vista<div><i style="width:48%;background:#C9A961"></i></div></div>
          <div class="f">Confirmada<div><i style="width:74%;background:#3E7C4A"></i></div></div>
          <div class="f">No asiste<div><i style="width:12%;background:#B5573B"></i></div></div>
        </div>
        <div class="box"><h4>Últimos movimientos</h4>
          <div class="ev"><b>✅</b><div><p style="width:70%"></p><p style="width:90%"></p></div></div>
          <div class="ev"><b>💬</b><div class="note"><p style="width:85%"></p><p style="width:60%"></p></div></div>
          <div class="ev"><b>📲</b><div><p style="width:65%"></p><p style="width:80%"></p></div></div>
        </div>
      </div>
      <div class="tbl">
        <div class="tr"><p style="width:70%"></p><p></p><span class="pill" style="background:#E5F1E6;color:#3E7C4A">● Confirmada</span><span class="wa">WhatsApp</span></div>
        <div class="tr"><p style="width:55%"></p><p></p><span class="pill" style="background:#F7EFDA;color:#A07A24">● Vista</span><span class="wa">WhatsApp</span></div>
        <div class="tr"><p style="width:64%"></p><p></p><span class="pill" style="background:#E8EFF7;color:#4F76A0">● Enviada</span><span class="wa">WhatsApp</span></div>
      </div>
    </div>
  </div>
</body></html>`;

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

await shot(advisorsHtml(), "public/og/asesoras.jpg", { type: "jpeg", quality: 86 });
await shot(backofficeHtml(), "public/og/backoffice.jpg", { type: "jpeg", quality: 88 });

for (const [size, path] of [
  [512, "app/icon.png"],
  [180, "app/apple-icon.png"],
]) {
  await page.setViewportSize({ width: size, height: size });
  await shot(iconHtml(size), path, { type: "png", omitBackground: true });
}

await browser.close();
