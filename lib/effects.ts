// Confeti y efectos de la tarjeta. canvas-confetti se carga solo cuando hay una interacción.
import type { CreateTypes, Options, Shape } from "canvas-confetti";

type Target = Element | { x: number; y: number } | null | undefined;

const PALETTE = ["#C9A961", "#E5D5B1", "#4B5A2F", "#6E7C4D", "#FBF9F2", "#D3A8A0"];
const GREENS = ["#4B5A2F", "#6E7C4D", "#8A9A6B", "#ADB497", "#C9A961"];
const LEAF = "M0,-9 C5,-7 6,-2 4,3 C2,7 -2,7 -4,3 C-6,-2 -5,-7 0,-9 Z";
const HEART = "M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z";

type Kit = { fire: CreateTypes; leaf: Shape; heart: Shape; note: Shape };
let kit: Promise<Kit> | null = null;

function load(): Promise<Kit> {
  kit ??= import("canvas-confetti").then(({ default: confetti }) => {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "300" });
    document.body.appendChild(canvas);
    // En grabaciones con reloj virtual (__vtAdvance) el confeti va en el hilo principal para seguir ese reloj.
    const fire = confetti.create(canvas, { resize: true, useWorker: !("__vtAdvance" in window), disableForReducedMotion: true });
    return {
      fire,
      leaf: confetti.shapeFromPath({ path: LEAF }),
      heart: confetti.shapeFromPath({ path: HEART }),
      note: confetti.shapeFromText({ text: "♪", scalar: 2, color: "#4B5A2F" }),
    };
  });
  return kit;
}

function origin(target: Target, fallbackY = 0.5) {
  if (!target) return { x: 0.5, y: fallbackY };
  if ("x" in target && "y" in target && !(target instanceof Element)) {
    return { x: target.x / innerWidth, y: target.y / innerHeight };
  }
  const r = (target as Element).getBoundingClientRect();
  return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
}

/** Bordes horizontales de la tarjeta (en escritorio no ocupa toda la pantalla). */
function cardEdges() {
  const card = document.querySelector(".inv-card")?.getBoundingClientRect();
  return card ? { left: card.left / innerWidth, right: card.right / innerWidth } : { left: 0, right: 1 };
}

export function haptic(ms = 18) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

const shoot = (k: Kit, o: Options) => k.fire({ colors: PALETTE, ...o });

/** Al abrir el sobre: estallido dorado + lluvia de hojas sobre la tarjeta. */
export async function envelopeBurst(target: Target) {
  haptic(25);
  const k = await load();
  const o = origin(target);
  shoot(k, { origin: o, particleCount: 70, spread: 110, startVelocity: 38, gravity: 0.9, scalar: 1.1, ticks: 220, shapes: ["circle", k.heart] });
  shoot(k, { origin: o, particleCount: 40, spread: 160, startVelocity: 24, gravity: 0.6, scalar: 1.4, ticks: 260, shapes: [k.leaf], colors: GREENS });
  leafRain(k, 2600);
}

function leafRain(k: Kit, duration: number) {
  const end = Date.now() + duration;
  const { left, right } = cardEdges();
  const frame = () => {
    if (Math.random() < 0.3) k.fire({
      particleCount: 1,
      startVelocity: 0,
      ticks: 420,
      gravity: 0.35,
      drift: Math.random() - 0.5,
      scalar: 1 + Math.random() * 0.6,
      origin: { x: left + Math.random() * (right - left), y: -0.05 },
      shapes: [k.leaf],
      colors: GREENS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/** Confirmación de asistencia: cañones desde los bordes de la tarjeta + corazones. */
export async function celebrate(target?: Target) {
  haptic(40);
  const k = await load();
  const { left, right } = cardEdges();
  const end = Date.now() + 1400;
  const frame = () => {
    shoot(k, { particleCount: 4, angle: 60, spread: 60, startVelocity: 55, origin: { x: left, y: 0.75 }, shapes: ["square", "circle", k.heart] });
    shoot(k, { particleCount: 4, angle: 120, spread: 60, startVelocity: 55, origin: { x: right, y: 0.75 }, shapes: ["square", "circle", k.heart] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  shoot(k, { origin: origin(target, 0.55), particleCount: 60, spread: 360, startVelocity: 28, scalar: 1.6, gravity: 0.7, ticks: 260, shapes: [k.heart], colors: ["#C9A961", "#D3A8A0", "#E5D5B1"] });
}

/** Respuesta "no podré ir": unos corazones suaves. */
export async function softHearts(target: Target) {
  const k = await load();
  shoot(k, { origin: origin(target), particleCount: 18, spread: 70, startVelocity: 18, gravity: 0.4, scalar: 1.5, ticks: 240, shapes: [k.heart], colors: ["#D3A8A0", "#E5D5B1", "#C9A961"] });
}

/** Lluvia de sobres: monedas doradas y corazones. */
export async function giftBurst(target: Target) {
  haptic(20);
  const k = await load();
  shoot(k, { origin: origin(target), particleCount: 60, angle: 90, spread: 80, startVelocity: 34, gravity: 1, scalar: 1.1, ticks: 200, shapes: ["circle", k.heart], colors: ["#C9A961", "#E5D5B1", "#B08D3C", "#FBF9F2"] });
}

/** Destello pequeño para clics (copiar, colores, enlaces). */
export async function sparkle(target: Target, colors: string[] = PALETTE) {
  const k = await load();
  shoot(k, { origin: origin(target), particleCount: 22, spread: 70, startVelocity: 16, gravity: 0.8, scalar: 0.8, ticks: 110, colors, shapes: ["star", "circle"] });
}

/** Botón de música: notas que suben. */
export async function notes(target: Target) {
  const k = await load();
  shoot(k, { origin: origin(target), particleCount: 10, angle: 100, spread: 70, startVelocity: 20, gravity: 0.35, drift: -0.4, scalar: 1.6, ticks: 140, shapes: [k.note] });
}
